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
import { CommandError } from "errors"
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

export async function handleFeedbackSetInProgress(i: ButtonInteraction) {
  if (!i.deferred) {
    i.deferUpdate()
  }

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
          customId: `handle-feedback-set-resolved_${feedbackId}`,
        })
      ),
    ],
  })

  sendProgressToPublicFeedbackChannel(feedback, i.user, i.guild?.channels)
}

export async function handleFeedbackSetResolved(i: ButtonInteraction) {
  if (!i.deferred) {
    i.deferUpdate()
  }

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
          customId: `handle-feedback-already-done`,
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
            embeds: [
              composeEmbedMessage(null, {
                author: ["Feedback solved", getEmojiURL(emojis.APPROVE)],
                description:
                  "We've solved your feedback. Thanks again for your contribution :pray:",
              }),
            ],
          })
        })
      }
    })
  }
}

export async function handleFeedback(req: RequestUserFeedbackRequest) {
  const res = await community.sendFeedback(req)
  if (!res.ok) {
    throw new CommandError({
      description: "Failed to send your feedback, please try again later",
    })
  }
  return getSuccessEmbed({
    title: "Feedback successfully sent",
    description:
      "We're so happy to hear from you! Thank you for valuable feedback. :pray:",
  })
}

export async function inviteUserToJoin() {
  const embed = composeEmbedMessage(null, {
    author: ["Build with us!", getEmojiURL(emojis.DEFI)],
    description:
      "Join our Discord server for more support and to contribute your idea to Mochi Bot",
  })

  return embed
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
          await inviteUserToJoin(),
        ],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton({
              label: "Join Mochi",
              style: "LINK",
              url: DISCORD_URL,
              emoji: getEmoji("MOCHI_SQUARE"),
            })
          ),
        ],
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
