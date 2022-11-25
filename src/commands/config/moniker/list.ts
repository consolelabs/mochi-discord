import config from "adapters/config"
import { Message, MessageEmbed } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getEmoji, paginate, roundFloatNumber } from "utils/common"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"

export async function handleMonikerList(guildId: string) {
  const { ok, data, log, curl } = await config.getMonikerConfig(guildId)
  if (!ok) {
    throw new APIError({ description: log, curl })
  }
  if (!data || data.length === 0) {
    return []
  }
  let pages = paginate(data, 10)
  pages = pages.map((arr: any, idx: number): MessageEmbed => {
    let col1 = ""
    let col2 = ""
    arr.forEach((item: any) => {
      col1 += `**${item.moniker.moniker}**\n`
      col2 += `${roundFloatNumber(item.moniker.amount, 4)} **${
        item.moniker.token.token_symbol
      }** (\u2248 $${item.value})\n`
    })
    return composeEmbedMessage(null, {
      title: `${getEmoji("bucket_cash", true)} Moniker List`,
      footer: [`Page ${idx + 1} / ${pages.length}`],
    }).addFields(
      { name: "Moniker", value: col1, inline: true },
      { name: "Value", value: col2, inline: true }
    )
  })
  return pages
}

const command: Command = {
  id: "moniker_list",
  command: "list",
  brief: "List all moniker configuations",
  category: "Config",
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const pages = await handleMonikerList(msg.guild.id)
    if (pages.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: `${getEmoji("bucket_cash", true)} Moniker List`,
              description:
                "You haven't set any moniker. To set one, run $moniker set <moniker> <amount_token> <token> .",
            }),
          ],
        },
      }
    }
    const msgOpts = {
      messageOptions: {
        embeds: [pages[0]],
        components: getPaginationRow(0, pages.length),
      },
    }
    const reply = await msg.reply(msgOpts.messageOptions)
    listenForPaginateAction(reply, msg, async (_msg: Message, idx: number) => {
      return {
        messageOptions: {
          embeds: [pages[idx]],
          components: getPaginationRow(idx, pages.length),
        },
      }
    })
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}monikers list`,
          examples: `${PREFIX}monikers list`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
