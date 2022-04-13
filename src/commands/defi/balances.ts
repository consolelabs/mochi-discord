import { Command } from "types/common"
import { Message, MessageEmbed } from "discord.js"
import { PREFIX, PROFILE_THUMBNAIL, SOCIAL_COLOR } from "env"
import {
  getEmbedFooter,
  getEmoji,
  getHeader,
  getHelpEmbed,
  roundFloatNumber,
} from "utils/discord"
import Social from "modules/social"

const command: Command = {
  id: "balances",
  command: "balances",
  name: "Balances",
  category: "Defi",
  run: async function balances(msg: Message) {
    const data = await Social.discordWalletBalances(msg.author.id, msg.guildId)

    let description = ""
    const supportedTokens = (await Social.getSupportedTokens()).map((token) =>
      token.symbol.toUpperCase()
    )

    const embedMsg = new MessageEmbed()
      .setColor(SOCIAL_COLOR)
      .setAuthor(`${msg.author.username}'s wallet`)
      .setTitle("Your balances")
      .setDescription(description)

    const blankEmoji = getEmoji("blank")
    for (const tokenSymbol of supportedTokens) {
      const tokenEmoji = getEmoji(tokenSymbol)
      let tokenBalance = roundFloatNumber(data.balances[tokenSymbol] ?? 0, 4)
      let tokenBalanceInUSD = data.balances_in_usd[tokenSymbol]
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
    embedMsg
      .addField(
        "Estimated total (U.S. dollar)",
        `**$${roundFloatNumber(totalBalanceInUSD, 4)}**`
      )
      .setFooter(getEmbedFooter([msg.author.tag]), msg.author.avatarURL())
      .setTimestamp()

    return {
      messageOptions: {
        embeds: [embedMsg],
        content: getHeader("View your tokens' balances", msg.author),
      },
    }
  },
  getHelpMessage: async () => {
    let embedMsg = getHelpEmbed("Balances")
      .setThumbnail(PROFILE_THUMBNAIL)
      .setTitle(`${PREFIX}balances`)
      .addField("_Examples_", `\`${PREFIX}balances\``)
      .setDescription(`\`\`\`Check your balances.\`\`\``)
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
  alias: ["balance", "bal", "bals"],
}

export default command
