import { Command } from "types/common"
import { PREFIX, STATS_GITBOOK } from "utils/constants"
import {
  MessageSelectOptionData,
  SelectMenuInteraction,
  Message,
} from "discord.js"
import {
  composeDiscordSelectionRow,
  composeDiscordExitButton,
  composeEmbedMessage,
} from "utils/discordEmbed"
import Community from "adapters/community"
import { GuildIdNotFoundError } from "errors"
import { capFirst } from "utils/common"
import {
  InteractionHandler,
  InteractionHandlerResult,
} from "utils/InteractionManager"

const countType: Array<string> = [
  "members",
  "channels",
  "stickers",
  "emojis",
  "roles",
]

const statsSelectionHandler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const id = input.split("_")[0]
  return await renderStatEmbed(message, id)
}

const countStatsHandler: InteractionHandler = async (msgOrInteraction) => {
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
    title: `Server Stats\n\n`,
    description: `${capFirst(
      type
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

async function renderStatEmbed(
  msg: Message,
  statId: string
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
          title: `Server Stats`,
          description: `Please select what type you want to show`,
        }),
      ],
      components: [selectRow, composeDiscordExitButton(msg.author.id)],
    },
    interactionOptions: {
      handler: countStatsHandler,
    },
  }
}
const command: Command = {
  id: "stats",
  command: "stats",
  brief: "Server Stats",
  category: "Community",
  onlyAdministrator: true,
  run: async function (msg) {
    const opt = (countType: unknown): MessageSelectOptionData => ({
      label: `${countType}`,
      value: `${countType}`,
    })

    const selectRow = composeDiscordSelectionRow({
      customId: "tickers_stat_selection",
      placeholder: "Select stat",
      options: countType.map((c) => opt(c)),
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: `Server Stats`,
            description: `Please select what stat you want to show`,
          }),
        ],
        components: [selectRow, composeDiscordExitButton(msg.author.id)],
      },
      interactionOptions: {
        handler: statsSelectionHandler,
      },
    }
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}stats -> select which stats from dropdown -> select which type from dropdown`,
      footer: [`Type ${PREFIX}help stats`],
      document: STATS_GITBOOK,
      examples: `${PREFIX}stats`,
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
