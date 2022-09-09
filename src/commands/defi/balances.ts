import { Command } from "types/common"
import { EmbedFieldData, Message } from "discord.js"
import { BALANCE_GITBOOK, PREFIX } from "utils/constants"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  roundFloatNumber,
  thumbnails,
} from "utils/common"
import Defi from "adapters/defi"
import {
  composeEmbedMessage,
  getErrorEmbed,
  justifyEmbedFields,
} from "utils/discordEmbed"
import Config from "adapters/config"

const command: Command = {
  id: "balances",
  command: "balances",
  brief: "Show your balances of the supported tokens",
  category: "Defi",
  run: async function balances(msg: Message) {
    const guildId = msg.guildId ?? "DM"
    const { balances, balances_in_usd } = await Defi.discordWalletBalances(
      guildId,
      msg.author.id
    )
    const guildTokens = await Config.getGuildTokens(guildId)

    if (!guildTokens) {
      const errorEmbed = getErrorEmbed({
        msg,
        description: `Your server currently has no tokens.\nUse \`${PREFIX}token add\` to add one.`,
      })
      return {
        messageOptions: {
          embeds: [errorEmbed],
        },
      }
    }

    const fields: EmbedFieldData[] = []
    const blank = getEmoji("blank")
    guildTokens.forEach((gToken) => {
      const tokenSymbol = gToken.symbol
      const tokenEmoji = getEmoji(tokenSymbol)
      const tokenBalance = roundFloatNumber(balances[tokenSymbol] ?? 0, 4)
      if (tokenBalance === 0) return
      const tokenBalanceInUSD = balances_in_usd[tokenSymbol]
      let balanceInfo = `${tokenEmoji} ${tokenBalance} ${tokenSymbol}`
      if (tokenBalanceInUSD !== undefined) {
        balanceInfo += ` \`$${roundFloatNumber(
          tokenBalanceInUSD,
          2
        )}\` ${blank}`
      }
      fields.push({ name: gToken.name, value: balanceInfo, inline: true })
    })

    if (!fields.length) {
      const embed = composeEmbedMessage(msg, {
        title: "Info",
        description: `<@${msg.author.id}>, you have no balances.`,
      })
      return {
        messageOptions: {
          embeds: [embed],
        },
      }
    }

    const totalBalanceInUSD = Object.values(balances_in_usd).reduce(
      (prev, cur) => prev + cur
    )

    const embed = composeEmbedMessage(msg, {
      author: ["View your balances", getEmojiURL(emojis.COIN)],
    }).addFields(fields)
    justifyEmbedFields(embed, 3)
    embed.addField(
      "\u200B\nEstimated total (U.S dollar)",
      `${getEmoji("money")} \`$${roundFloatNumber(totalBalanceInUSD, 4)}\``
    )

    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        usage: `${PREFIX}balances`,
        document: BALANCE_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["balance", "bal", "bals"],
  allowDM: true,
  colorType: "Defi",
}

export default command
