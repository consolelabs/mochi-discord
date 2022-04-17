import { Command } from "types/common"
import { Message } from "discord.js"
import { PREFIX } from "utils/constants"
import { getEmoji, getHeader, roundFloatNumber, thumbnails } from "utils/common"
import Defi from "modules/defi"
import { composeEmbedMessage } from "utils/discord-embed"

const command: Command = {
  id: "balances",
  command: "balances",
  name: "Balances",
  category: "Defi",
  run: async function balances(msg: Message) {
    const data = await Defi.discordWalletBalances(msg.author.id)
    const supportedTokens = (await Defi.getSupportedTokens()).map((token) =>
      token.symbol.toUpperCase()
    )

    const embedMsg = composeEmbedMessage(msg, {
      title: "Your balances",
    })

    const blankEmoji = getEmoji("blank")
    for (const tokenSymbol of supportedTokens) {
      const tokenEmoji = getEmoji(tokenSymbol)
      let tokenBalance = roundFloatNumber(data.balances[tokenSymbol] ?? 0, 4)
      const tokenBalanceInUSD = data.balances_in_usd[tokenSymbol]
      let balanceInfo = `${tokenEmoji} **${tokenBalance}**`
      if (tokenBalanceInUSD !== undefined)
        balanceInfo += ` (≈ $${roundFloatNumber(tokenBalanceInUSD, 2)})`
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
        content: getHeader("View your tokens' balances", msg.author),
      },
    }
  },
  getHelpMessage: async (msg) => {
    const embedMsg = composeEmbedMessage(msg, {
      thumbnail: thumbnails.TOKENS,
      description: `\`\`\`Check your balances.\`\`\``,
    }).addField("_Examples_", `\`${PREFIX}balances\``)
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
  alias: ["balance", "bal", "bals"],
}

export default command
