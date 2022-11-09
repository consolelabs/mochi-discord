import community from "adapters/community"
import {
  ButtonInteraction,
  GuildChannelManager,
  Message,
  MessageActionRow,
  MessageButton,
  User,
} from "discord.js"
import { FEEDBACK_PUBLIC_CHANNEL_ID } from "env"
import { APIError, CommandError } from "errors"
import { logger } from "logger"
import { ModelUserFeedback, RequestUserFeedbackRequest } from "types/api"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { DISCORD_URL, FEEDBACK_GITBOOK, PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import truncate from "lodash/truncate"
import chunk from "lodash/chunk"

const successEmbed = () =>
  getSuccessEmbed({
    title: "Feedback successfully sent",
    description:
      "We're so happy to hear from you! Thank you for valuable feedback. :pray:",
  })
const feedbackSolvedEmbed = () =>
  composeEmbedMessage(null, {
    author: ["Feedback solved", getEmojiURL(emojis.APPROVE)],
    description:
      "We've solved your feedback. Thanks again for your contribution :pray:",
  })

async function sendProgressToPublicFeedbackChannel(
  feedback: ModelUserFeedback,
  user: User,
  channels?: GuildChannelManager
) {
  const embed = composeEmbedMessage(null, {
    title: `${getEmoji(
      feedback.status === "completed" ? "approve" : "approve_grey"
    )} This feedback is ${
      feedback.status === "completed" ? "resolved" : "being worked on"
    }`,
    description: `${user} has something to say${
      feedback.command ? ` for command ${feedback.command.toUpperCase()}` : ""
    }\n\`${feedback.feedback}\``,
    color: "#fcd3c1",
  }).setFooter(user?.tag, user.avatarURL() ?? undefined)

  logger.info("[handleFeedback] - fetching public channel")
  const channel = await channels?.fetch(FEEDBACK_PUBLIC_CHANNEL_ID)
  if (!channel || !channel.isText()) {
    logger.error("[handleFeedback] - no public feedback channel found")
    return
  }

  logger.info(
    `[handleFeedback] - sending update in-progress to public feedback channel ${feedback.id}`
  )

  channel.send({ embeds: [embed] })
}

export const getComponentsNormalState = (
  discordId: string,
  isFromSuccess: boolean,
  disableIndex = 0
) =>
  new MessageActionRow().addComponents(
    new MessageButton({
      label: "Back",
      style: "SECONDARY",
      customId: `feedback-back_${isFromSuccess}`,
      disabled: disableIndex === 0,
    }),
    new MessageButton({
      label: "Join Mochi",
      style: "LINK",
      url: DISCORD_URL,
      emoji: getEmoji("MOCHI_CIRCLE"),
      disabled: disableIndex === 1,
    }),
    new MessageButton({
      label: "Your feedback list",
      style: "SECONDARY",
      customId: `feedback-view-list_${discordId}`,
      disabled: disableIndex === 2,
    }),
    new MessageButton({
      label: "All feedback list",
      style: "SECONDARY",
      customId: `feedback-view-list`,
      disabled: disableIndex === 3,
    })
  )

export const getArrowButtons = (opts?: {
  disableLeft?: boolean
  disableRight?: boolean
  page?: number
}) =>
  new MessageActionRow().addComponents(
    new MessageButton({
      label: "\u200b",
      emoji: getEmoji("left_arrow"),
      customId: `feedback-list-view-back_${opts?.page ?? 0}`,
      style: "SECONDARY",
      disabled: opts?.disableLeft ?? true,
    }),
    new MessageButton({
      label: "\u200b",
      emoji: getEmoji("right_arrow"),
      customId: `feedback-list-view-next_${opts?.page ?? 0}`,
      style: "SECONDARY",
      disabled: opts?.disableRight ?? false,
    })
  )

async function handleFeedbackSetInProgress(i: ButtonInteraction) {
  const feedbackId = i.customId.split("_").pop()
  if (!feedbackId) {
    logger.error(`[handleFeedback] - unable to get feedback id ${i.message.id}`)
    return
  }
  logger.info(
    `[handleFeedback] - updating status to in-progress of feedback ${feedbackId}`
  )
  const updateRes = await community.updateFeedback(feedbackId, "confirmed")
  if (!updateRes.ok) {
    logger.error(
      `[handleFeedback] - unable to set in-progress feedback ${feedbackId}`
    )
    return
  }
  const feedback = updateRes.data
  const msg = i.message as Message
  msg.edit({
    components: [
      new MessageActionRow().addComponents(
        new MessageButton({
          label: "Resolved",
          style: "SECONDARY",
          emoji: getEmoji("approve"),
          customId: `feedback-handle-set-resolved_${feedbackId}`,
        })
      ),
    ],
  })

  sendProgressToPublicFeedbackChannel(feedback, i.user, i.guild?.channels)
}

async function handleFeedbackSetResolved(i: ButtonInteraction) {
  const feedbackId = i.customId.split("_").pop()
  if (!feedbackId) {
    logger.error(`[handleFeedback] - unable to get feedback id ${i.message.id}`)
    return
  }
  logger.info(
    `[handleFeedback] - updating status to in-progress of feedback ${feedbackId}`
  )
  const updateRes = await community.updateFeedback(feedbackId, "completed")
  if (!updateRes.ok) {
    logger.error(
      `[handleFeedback] - unable to set in-progress feedback ${feedbackId}`
    )
    return
  }
  const feedback = updateRes.data
  const msg = i.message as Message

  msg.edit({
    components: [
      new MessageActionRow().addComponents(
        new MessageButton({
          label: "Already done",
          style: "SECONDARY",
          customId: `feedback-handle-already-done`,
          disabled: true,
        })
      ),
    ],
  })

  sendProgressToPublicFeedbackChannel(feedback, i.user, i.guild?.channels)

  // user used text version of the feedback command -> reply
  if (feedback.message_id) {
    const [channelId, msgId] = feedback.message_id.split("/")
    logger.info(
      "[handleFeedback] - begin send resolved reply, fetching channel"
    )
    i.client.channels.fetch(channelId).then((channel) => {
      if (channel?.isText()) {
        logger.info(
          "[handleFeedback] - channel found, fetching original message"
        )
        channel.messages.fetch(msgId).then((msg) => {
          logger.info(
            "[handleFeedback] - message found, sending resolved reply"
          )
          msg.reply({
            embeds: [feedbackSolvedEmbed()],
            components: [getComponentsNormalState(i.user.id, false)],
          })
        })
      }
    })
  }
}

async function handleViewFeedbackList(i: ButtonInteraction, page = 0) {
  const [, discordId] = i.customId.split("_")

  const ownListRes = await community.getFeedbackList(discordId)
  if (!ownListRes.ok) {
    throw new APIError({ curl: ownListRes.curl, description: ownListRes.log })
  }

  const ownList = ownListRes.data
  const paginated = chunk(ownList, 5)

  const msg = i.message as Message

  const embed = composeEmbedMessage(null, {
    title: `${discordId ? "Your" : "All"} Feedback list`,
    footer: [`Page ${page + 1}/${paginated.length}`],
  })

  embed.setFields(
    {
      name: "Command",
      value: getEmoji("blank"),
      inline: true,
    },
    {
      name: "Feedback",
      value: getEmoji("blank"),
      inline: true,
    },
    {
      name: "Progress",
      value: getEmoji("blank"),
      inline: true,
    }
  )

  embed.addFields(
    paginated[page].flatMap((f) => {
      return [
        {
          name: getEmoji("blank"),
          value: f.command || "General",
          inline: true,
        },
        {
          name: getEmoji("blank"),
          value: `\`${truncate(f.feedback || "...")}\``,
          inline: true,
        },
        {
          name: getEmoji("blank"),
          value:
            f.status?.toLowerCase() === "completed"
              ? getEmoji("approve")
              : f.status?.toLowerCase() === "confirmed"
              ? getEmoji("approve_grey")
              : "None",
          inline: true,
        },
      ]
    })
  )

  msg.edit({
    embeds: [embed, ...msg.embeds.slice(1)],
    components: [
      getArrowButtons({
        disableLeft: page === 0 || paginated.length === 1,
        disableRight: !paginated[page] || paginated.length === 1,
        page,
      }),
      getComponentsNormalState(i.user.id, true, discordId ? 2 : 3),
    ],
  })
}

export async function handleFeedback(req: RequestUserFeedbackRequest) {
  const res = await community.sendFeedback(req)
  if (!res.ok) {
    throw new CommandError({
      description: "Failed to send your feedback, please try again later",
    })
  }
  return successEmbed()
}

export function inviteUserToJoin() {
  const embed = composeEmbedMessage(null, {
    author: ["You might need more help", getEmojiURL(emojis.DEFI)],
    description:
      "Join our Discord server for more support and to contribute your idea to Mochi Bot.",
  })

  return embed
}

export async function feedbackDispatcher(i: ButtonInteraction) {
  if (!i.deferred) {
    i.deferUpdate().catch(() => null)
  }
  const stripPrefix = i.customId.slice("feedback-".length)
  const msg = i.message as Message
  switch (true) {
    case stripPrefix.startsWith("handle-set-in-progress"):
      await handleFeedbackSetInProgress(i)
      break
    case stripPrefix.startsWith("handle-set-resolved"):
      await handleFeedbackSetResolved(i)
      break
    case stripPrefix.startsWith("view-list"):
      await handleViewFeedbackList(i)
      break
    case stripPrefix.startsWith("list-view-next"): {
      const [, page] = i.customId.split("_")

      await handleViewFeedbackList(i, Number(page) + 1)
      break
    }
    case stripPrefix.startsWith("list-view-back"): {
      const [, page] = i.customId.split("_")

      await handleViewFeedbackList(i, Number(page) - 1)
      break
    }
    case stripPrefix.startsWith("back"): {
      if (i.customId.split("_").pop() === "true") {
        msg.edit({
          embeds: [successEmbed(), ...msg.embeds.slice(1)],
          components: [getComponentsNormalState(i.user.id, true)],
        })
      } else {
        msg.edit({
          embeds: [feedbackSolvedEmbed(), ...msg.embeds.slice(1)],
          components: [getComponentsNormalState(i.user.id, false)],
        })
      }
      break
    }
    default:
      break
  }
}

const command: Command = {
  id: "feedback",
  command: "feedback",
  brief: "Feedback",
  category: "Community",
  run: async (msg) => {
    const args = getCommandArguments(msg)
    if (args.length == 1) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              usage: `${PREFIX}feedback <${PREFIX}command> <description>`,
              examples: `${PREFIX}feedback i like it\n${PREFIX}feedback $gm UI can be better`,
              footer: [`Type ${PREFIX}help for more actions!`],
              description:
                "Give feedback for the Mochi team about a specific command or in general",
            }),
          ],
        },
      }
    }
    let commandArg = args[1]
    let feedback = ""
    if (commandArg[0] == "$") commandArg = commandArg.slice(1).toUpperCase()
    else commandArg = ""

    if (commandArg === "") feedback = args.slice(1).join(" ")
    else feedback = args.slice(2).join(" ")

    if (!feedback) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Feedback failed.",
              description: `Looks like your feedback is empty.`,
              originalMsgAuthor: msg.author,
            }),
          ],
        },
      }
    }

    const avatar = msg.author.avatarURL() ?? ""

    return {
      messageOptions: {
        embeds: [
          await handleFeedback({
            discord_id: msg.author.id,
            username: msg.author.username,
            avatar,
            command: commandArg,
            feedback,
            message_id: `${msg.channelId}/${msg.id}`,
          }),
          inviteUserToJoin(),
        ],
        components: [getComponentsNormalState(msg.author.id, true)],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}feedback <${PREFIX}command> <description>`,
        examples: `${PREFIX}feedback i like it\n${PREFIX}feedback $gm UI can be better`,
        footer: [`Type ${PREFIX}help for more actions!`],
        description:
          "Give feedback for the Mochi team about a specific command or in general",
        document: FEEDBACK_GITBOOK,
      }),
    ],
  }),
  colorType: "Command",
  canRunWithoutAction: true,

  allowDM: true,
}

export default command
