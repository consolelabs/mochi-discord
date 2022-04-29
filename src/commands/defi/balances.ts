import { Command } from "types/common"
import { Message } from "discord.js"
import { PREFIX } from "utils/constants"
import { getEmoji, getHeader, roundFloatNumber, thumbnails } from "utils/common"
import Defi from "adapters/defi"
import { composeEmbedMessage } from "utils/discordEmbed"

const command: Command = {
  id: "balances",
  command: "balances",
  brief: "Show your balances of the supported tokens",
  category: "Defi",
  run: async function balances(msg: Message) {
    const data = await Defi.discordWalletBalances(msg.author.id)
    const supportedTokens = (await Defi.getSupportedTokens()).map(token =>
      token.symbol.toUpperCase()
    )

    const embedMsg = composeEmbedMessage(msg, {
      title: "Your balances"
    })

    const blankEmoji = getEmoji("blank")
    for (const tokenSymbol of supportedTokens) {
      const tokenEmoji = getEmoji(tokenSymbol)
      let tokenBalance = roundFloatNumber(data.balances[tokenSymbol] ?? 0, 4)
      const tokenBalanceInUSD = data.balances_in_usd[tokenSymbol]
      let balanceInfo = `${tokenEmoji} **${tokenBalance}**`
      if (tokenBalanceInUSD !== undefined)
        balanceInfo += ` (\u2248 $${roundFloatNumber(tokenBalanceInUSD, 2)})`
      balanceInfo += blankEmoji
      tokenBalance = roundFloatNumber(tokenBalance, 4)
      embedMsg.addField(tokenSymbol, balanceInfo, true)
    }

    const totalBalanceInUSD = Object.values(data.balances_in_usd).reduce(
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
