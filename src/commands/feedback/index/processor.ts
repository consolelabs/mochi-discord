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
import { APIError, InternalError } from "errors"
import { logger } from "logger"
import { ModelUserFeedback } from "types/api"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { DISCORD_URL } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import truncate from "lodash/truncate"
import { getProfileIdByDiscord } from "../../../utils/profile"

const successEmbed = () =>
  getSuccessEmbed({
    title: "Feedback successfully sent",
    description:
      "We're so happy to hear from you! Thank you for valuable feedback. :pray:",
  })
const feedbackSolvedEmbed = () =>
  composeEmbedMessage(null, {
    author: ["Feedback solved", getEmojiURL(emojis.CHECK)],
    description:
      "We've solved your feedback. Thanks again for your contribution :pray:",
  })

async function sendProgressToPublicFeedbackChannel(
  feedback: ModelUserFeedback,
  user: User,
  channels?: GuildChannelManager,
) {
  const embed = composeEmbedMessage(null, {
    title: `${getEmoji(
      feedback.status === "COMPLETED" ? "APPROVE" : "APPROVE_GREY",
    )} This feedback is ${
      feedback.status === "completed" ? "resolved" : "being worked on"
    }`,
    description: `${user} has something to say${
      feedback.command ? ` for command ${feedback.command.toUpperCase()}` : ""
    }\n\`${feedback.feedback}\``,
    color: msgColors.PINK,
  }).setFooter(user?.tag, user.avatarURL() ?? undefined)

  logger.info("[handleFeedback] - fetching public channel")
  const channel = await channels?.fetch(FEEDBACK_PUBLIC_CHANNEL_ID)
  if (!channel || !channel.isText()) {
    logger.error("[handleFeedback] - no public feedback channel found")
    return
  }

  logger.info(
    `[handleFeedback] - sending update in-progress to public feedback channel ${feedback.id}`,
  )

  channel.send({ embeds: [embed] })
}

export const getComponentsNormalState = (
  discordId: string,
  isFromSuccess: boolean,
  disableIndex = 0,
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
    }),
  )

export const getArrowButtons = (opts?: {
  disableLeft?: boolean
  disableRight?: boolean
  page?: number
  discordId?: string
}) =>
  new MessageActionRow().addComponents(
    new MessageButton({
      label: "\u200b",
      emoji: getEmoji("LEFT_ARROW"),
      customId: `feedback-list-view-back_${opts?.page ?? 0}_${
        opts?.discordId ?? ""
      }`,
      style: "SECONDARY",
      disabled: opts?.disableLeft ?? true,
    }),
    new MessageButton({
      label: "\u200b",
      emoji: getEmoji("RIGHT_ARROW"),
      customId: `feedback-list-view-next_${opts?.page ?? 0}_${
        opts?.discordId ?? ""
      }`,
      style: "SECONDARY",
      disabled: opts?.disableRight ?? false,
    }),
  )

async function handleFeedbackSetInProgress(i: ButtonInteraction) {
  const feedbackId = i.customId.split("_").pop()
  if (!feedbackId) {
    logger.error(`[handleFeedback] - unable to get feedback id ${i.message.id}`)
    return
  }
  logger.info(
    `[handleFeedback] - updating status to in-progress of feedback ${feedbackId}`,
  )
  const updateRes = await community.updateFeedback(feedbackId, "confirmed")
  if (!updateRes.ok) {
    logger.error(
      `[handleFeedback] - unable to set in-progress feedback ${feedbackId}`,
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
          emoji: getEmoji("CHECK"),
          customId: `feedback-handle-set-resolved_${feedbackId}`,
        }),
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
    `[handleFeedback] - updating status to in-progress of feedback ${feedbackId}`,
  )
  const updateRes = await community.updateFeedback(feedbackId, "completed")
  if (!updateRes.ok) {
    logger.error(
      `[handleFeedback] - unable to set in-progress feedback ${feedbackId}`,
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
        }),
      ),
    ],
  })

  sendProgressToPublicFeedbackChannel(feedback, i.user, i.guild?.channels)

  // user used text version of the feedback command -> reply
  if (feedback.message_id) {
    const [channelId, msgId] = feedback.message_id.split("/")
    logger.info(
      "[handleFeedback] - begin send resolved reply, fetching channel",
    )
    i.client.channels.fetch(channelId).then((channel) => {
      if (channel?.isText()) {
        logger.info(
          "[handleFeedback] - channel found, fetching original message",
        )
        channel.messages.fetch(msgId).then((msg) => {
          logger.info(
            "[handleFeedback] - message found, sending resolved reply",
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

async function handleViewFeedbackList(
  i: ButtonInteraction,
  page: number,
  discordId?: string,
) {
  const profileId = discordId
    ? await getProfileIdByDiscord(discordId || "")
    : ""
  const res = await community.getFeedbackList(discordId, page, profileId)
  if (!res.ok) {
    throw new APIError({
      curl: res.curl,
      description: res.log,
      status: res.status ?? 500,
      error: res.error,
    })
  }

  const data = res.data.data ?? []

  const msg = i.message as Message

  const totalPage = Math.ceil(((res.data.total ?? 0) + 1) / 5)
  const embed = composeEmbedMessage(null, {
    title: `${discordId ? "Your" : "All"} Feedback list`,
    footer: [`Page ${page + 1}/${totalPage}`],
  })

  embed.addFields([
    {
      name: "Command",
      value: data
        .map((d) => {
          return `**${d.command || "General"}**`
        })
        .join("\n"),
      inline: true,
    },
    {
      name: "Feedback",
      value: data
        .map((d) => {
          return `\`${truncate(d.feedback || "...", { length: 15 })}\``
        })
        .join("\n"),
      inline: true,
    },
    {
      name: "Progress",
      value: data
        .map((d) => {
          return `${
            d.status?.toLowerCase() === "completed"
              ? getEmoji("APPROVE")
              : d.status?.toLowerCase() === "confirmed"
              ? getEmoji("APPROVE_GREY")
              : "None"
          }`
        })
        .join("\n"),
      inline: true,
    },
  ])

  msg.edit({
    embeds: [embed, ...msg.embeds.slice(1)],
    components: [
      getArrowButtons({
        disableLeft: page === 0,
        disableRight: page + 1 === totalPage,
        page,
        discordId,
      }),
      getComponentsNormalState(i.user.id, true, discordId ? 2 : 3),
    ],
  })
}

export async function handleFeedback(req: any, message?: Message) {
  const res = await community.sendFeedback(req)
  if (!res.ok) {
    throw new InternalError({
      msgOrInteraction: message,
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
  const refMsg = await msg.fetchReference().catch(() => null)
  let authorId = refMsg?.author.id
  if (!refMsg) {
    authorId = msg.interaction?.user.id
  }
  if (authorId !== i.user.id && !stripPrefix.startsWith("handle-set")) return
  switch (true) {
    case stripPrefix.startsWith("handle-set-in-progress"):
      await handleFeedbackSetInProgress(i)
      break
    case stripPrefix.startsWith("handle-set-resolved"):
      await handleFeedbackSetResolved(i)
      break
    case stripPrefix.startsWith("view-list"): {
      const parts = i.customId.split("_")

      await handleViewFeedbackList(
        i,
        0,
        parts.length === 2 ? parts.pop() : undefined,
      )
      break
    }
    case stripPrefix.startsWith("list-view-next"): {
      const [, page, discordId] = i.customId.split("_")

      await handleViewFeedbackList(i, Number(page) + 1, discordId || undefined)
      break
    }
    case stripPrefix.startsWith("list-view-back"): {
      const [, page, discordId] = i.customId.split("_")

      await handleViewFeedbackList(i, Number(page) - 1, discordId || undefined)
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
