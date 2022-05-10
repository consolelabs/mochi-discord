import { Command } from "types/common"
import { Message } from "discord.js"
import { PREFIX } from "utils/constants"
import { getEmoji, getHeader, roundFloatNumber, thumbnails } from "utils/common"
import Defi from "adapters/defi"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import Config from "adapters/config"

const command: Command = {
  id: "balances",
  command: "balances",
  brief: "Show your balances of the supported tokens",
  category: "Defi",
  run: async function balances(msg: Message) {
    const { balances, balances_in_usd } = await Defi.discordWalletBalances(
      msg.guildId,
      msg.author.id
    )
    const guildTokens = await Config.getGuildTokens(msg.guildId)

    if (!guildTokens)
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: `Your server currently has no tokens.\nUse \`${PREFIX}token add\` to add one.`
            })
          ]
        }
      }

    const embedMsg = composeEmbedMessage(msg, {
      author: [`${msg.author.username}'s balances`, msg.author.avatarURL()]
    })

    guildTokens.forEach(gToken => {
      const tokenSymbol = gToken.symbol
      const tokenEmoji = getEmoji(tokenSymbol)
      const tokenBalance = roundFloatNumber(balances[tokenSymbol] ?? 0, 4)
      if (tokenBalance === 0) return
      const tokenBalanceInUSD = balances_in_usd[tokenSymbol]
      let balanceInfo = `${tokenEmoji} **${tokenBalance} ${tokenSymbol}**`
      if (tokenBalanceInUSD !== undefined)
        balanceInfo += ` (\u2248$${roundFloatNumber(tokenBalanceInUSD, 2)})`
      embedMsg.addField(gToken.name, balanceInfo, true)
    })

    if (embedMsg.fields.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "Info",
              description: `<@${msg.author.id}>, you have no balances.`
            })
          ]
        }
      }
    }

    const totalBalanceInUSD = Object.values(balances_in_usd).reduce(
      (prev, cur) => prev + cur
    )
    embedMsg.addField(
      "Estimated total (U.S. dollar)",
      `**$${roundFloatNumber(totalBalanceInUSD, 4)}**`
    )

    return {
      messageOptions: {
        embeds: [embedMsg],
        content: getHeader("View your tokens' balances", msg.author)
      }
    }
  },
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        usage: `${PREFIX}balances`
      })
    ]
  }),
  canRunWithoutAction: true,
  aliases: ["balance", "bal", "bals"]
}

export default command
