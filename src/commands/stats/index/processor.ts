import {
  MessageSelectOptionData,
  SelectMenuInteraction,
  Message,
  CommandInteraction,
} from "discord.js"

import Community from "adapters/community"
import { GuildIdNotFoundError } from "errors"
import { capFirst, emojis, getAuthor, getEmojiURL } from "utils/common"
import {
  InteractionHandler,
  InteractionHandlerResult,
} from "handlers/discord/select-menu"
import { composeEmbedMessage } from "ui/discord/embed"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { composeDiscordExitButton } from "ui/discord/button"

export const countType: Array<string> = [
  "members",
  "channels",
  "stickers",
  "emojis",
  "roles",
]

export const statsSelectionHandler: InteractionHandler = async (
  msgOrInteraction,
) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const id = input.split("_")[0]
  return await renderStatEmbed(message, id)
}

export const countStatsHandler: InteractionHandler = async (
  msgOrInteraction,
) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [type, stat] = input.split("_")
  const countTypeReq = type + "_" + stat
  if (!message.guildId) {
    throw new GuildIdNotFoundError({ message: msgOrInteraction })
  }
  await Community.createStatChannel(message.guildId, countTypeReq)
  const successEmbeded = composeEmbedMessage(message, {
    author: ["Server Stats", getEmojiURL(emojis.AMPAWSSADORBADGE)],
    description: `${capFirst(
      type,
    )} ${stat} count is shown as a voice channel on top of your server. `,
  })
  return {
    messageOptions: {
      embeds: [successEmbeded],
      components: [],
    },
    commandChoiceOptions: {
      interaction,
    },
  }
}

export async function renderStatEmbed(
  msg: Message,
  statId: string,
): Promise<InteractionHandlerResult> {
  let statType = ""
  switch (statId) {
    case "members":
      statType = " all, user, bot"
      break
    case "channels":
      statType = " all, text, voice, stage, category, announcement"
      break
    case "emojis":
      statType = " all, static, animated"
      break
    case "stickers":
      statType = " all, custom, server"
      break
    case "roles":
      statType = " all"
      break
    default:
      statType = ""
      break
  }
  const statTypeReplace = statType.replaceAll(" ", "")
  const statTypeList: Array<string> = statTypeReplace.split(",")

  const opt = (statType: unknown): MessageSelectOptionData => ({
    label: `${statType}`,
    value: `${statType}_${statId}`,
  })
  const selectRow = composeDiscordSelectionRow({
    customId: "tickers_type_selection",
    placeholder: "Select type",
    options: statTypeList.map((c) => opt(c)),
  })

  msg.content = statId
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          author: ["Server Stats", getEmojiURL(emojis.AMPAWSSADORBADGE)],
          description: "Please select what type you want to display",
        }),
      ],
      components: [selectRow, composeDiscordExitButton(msg.author.id)],
    },
    interactionOptions: {
      handler: countStatsHandler,
    },
  }
}

export async function handle(msg: Message | CommandInteraction) {
  const opt = (countType: unknown): MessageSelectOptionData => ({
    label: `${countType}`,
    value: `${countType}`,
  })

  const selectRow = composeDiscordSelectionRow({
    customId: "tickers_stat_selection",
    placeholder: "Select stat",
    options: countType.map((c) => opt(c)),
  })

  const authorId = getAuthor(msg).id

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Server Stats", getEmojiURL(emojis.AMPAWSSADORBADGE)],
          description: "Please select what stat you want to display",
        }),
      ],
      components: [selectRow, composeDiscordExitButton(authorId)],
    },
    interactionOptions: {
      handler: statsSelectionHandler,
    },
  }
}
