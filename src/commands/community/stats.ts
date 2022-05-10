import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { API_BASE_URL } from "utils/constants"
import { logger } from "logger"
import fetch from "node-fetch"
import {getHeader} from "utils/common"
import { MessagePayload, MessageEmbed, MessageSelectOptionData, SelectMenuInteraction, Message } from "discord.js"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import {
  composeDiscordSelectionRow,
  composeDiscordExitButton,
  composeEmbedMessage
} from "utils/discordEmbed"

var countType: Array<string> = ['members', 'channels', 'stickers', 'emojis', 'roles'];

const statsSelectionHandler: CommandChoiceHandler = async msgOrInteraction => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [id, stat] = input.split("_")
  return await renderStatEmbed(message, id, stat)
}

const countStatsHandler: CommandChoiceHandler = async msgOrInteraction => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [type, stat] = input.split("_")
  // call api create channel
  try {
    let countTypeReq = type + "_" + stat
    const res = fetch(
      `${API_BASE_URL}/guilds/${message.guild.id}/channels?count_type=${countTypeReq}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    )
    // return null
  } catch (e: any) {
    logger.error(e)
  }
  let successEmbeded = composeEmbedMessage(message, {
    title: `Server Stats\n\n`,
    description: `Successfully count ` + type + ` ` + stat
  })
  return {
    messageOptions: {
      embeds: [
        successEmbeded
      ],
      components: []
    }
  }
}

async function renderStatEmbed (
  msg: Message,
  statId: string,
  stat: string
) {
  let statType = ''
  switch (statId) {
    case 'members':
      statType = ' all, user, bot'
      break
    case 'channels':
      statType = ' all, text, voice, stage, category, announcement'
      break
    case 'emojis':
      statType = ' all, static, animated'
      break
    case 'stickers':
      statType = ' all, standard, guild'
      break
    case 'roles':
        statType = ' all'
        break
    default:
      statType = ''
      break
  }
  let statTypeReplace = statType.replaceAll(' ', '')
  var statTypeList: Array<string> = statTypeReplace.split(',')

  const opt = (statType: any): MessageSelectOptionData => ({
    label: `${statType}`,
    value: `${statType}_${statId}`
  })
  const selectRow = composeDiscordSelectionRow({
    customId: "tickers_type_selection",
    placeholder: "Select type",
    options: statTypeList.map(c => opt(c))
  })

  msg.content = statId
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          title: `Server Stats`,
          description: `Please select what type you want to show`
        })
      ],
      components: [selectRow, composeDiscordExitButton()],
    },
    commandChoiceOptions: {
      userId: msg.author.id,
      guildId: msg.guildId,
      channelId: msg.channelId,
      handler: countStatsHandler
    }
  }
}
const command: Command = {
  id: "stats",
  command: "stats",
  brief: "Server Stats",
  category: "Community",
  onlyAdministrator: true,
  run: async function (msg, action) { 
    // const args = getCommandArguments(msg)
    const opt = (countType: any): MessageSelectOptionData => ({
      label: `${countType}`,
      value: `${countType}`
    })

    const selectRow = composeDiscordSelectionRow({
      customId: "tickers_stat_selection",
      placeholder: "Select stat",
      options: countType.map(c => opt(c))
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: `Server Stats`,
            description: `Please select what stat you want to show`
          })
        ],
        components: [selectRow, composeDiscordExitButton()]
      },
      commandChoiceOptions: {
        userId: msg.author.id,
        guildId: msg.guildId,
        channelId: msg.channelId,
        handler: statsSelectionHandler
      }
    }
  },
  getHelpMessage: async (msg, action) => {

    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}stats`,
      footer: [`Type ${PREFIX}help stats`],
      examples: `${PREFIX}stats`
    })

    return { embeds: [embed] }
  },
}

export default command
