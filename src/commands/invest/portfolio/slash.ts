import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import community from "adapters/community"
import {
  composeEmbedMessage,
  formatDataTable,
  getErrorEmbed,
} from "ui/discord/embed"
import mochiPay from "adapters/mochi-pay"
import { getProfileIdByDiscord } from "utils/profile"
import { APPROX, VERTICAL_BAR } from "utils/constants"
import { ResponseInvestPlatforms } from "types/api"
import { emojis, getEmoji, getEmojiURL, TokenEmojiKey } from "utils/common"
import { formatTokenDigit, formatUsdDigit } from "utils/defi"

const slashCmd: SlashCommand = {
  name: "portfolio",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("portfolio")
      .setDescription("Track your earning portfolio")
      .addStringOption((opt) =>
        opt
          .setName("chain")
          .setDescription("filter earn by chain")
          .setRequired(false)
          .addChoices([
            ["Ethereum", "1"],
            ["BSC", "56"],
            ["Polygon", "137"],
            ["Avalance", "43114"],
            ["Fantom", "250"],
            ["Arbitrum", "42161"],
            ["Optimism", "10"],
          ])
      )
      .addStringOption((opt) =>
        opt
          .setName("platform")
          .setDescription("filter earn by platform")
          .setRequired(false)
          .setAutocomplete(true)
      )

    return data
  },
  autocomplete: async function (i) {
    const focusedValue = i.options.getFocused()
    const chainId = i.options.getString("chain", true)

    const { ok, data } = await community.getEarns({
      chainIds: chainId,
      types: "lend", // get lend only
      status: "active",
    })

    if (!ok) {
      await i.respond([])
      return
    }
    const formatter = Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
      notation: "compact",
    })
    const platforms = data[0].platforms
    const options = platforms
      ?.filter((p: ResponseInvestPlatforms) =>
        p?.name?.toLowerCase().includes(focusedValue.toLowerCase())
      )
      .map((p: ResponseInvestPlatforms) => ({
        name: `[${p.name?.toUpperCase()}] APY: ${p.apy?.toFixed(
          2
        )}% - TVL: ${formatter.format(p.tvl ?? 0)}`,
        value: p.name ?? "NA",
      }))

    await i.respond(options ?? [])
  },
  run: async function (i: CommandInteraction) {
    const chainId = i.options.getString("chain")
    const platform = i.options.getString("platform")
    const profileId = await getProfileIdByDiscord(i.user.id)
    const { ok, data } = await mochiPay.getKrystalEarnPortfolio({
      profile_id: profileId,
      chain_id: chainId ?? "",
      platform: platform ?? "",
    })

    if (!ok) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Failed to get earning portfolio",
              description: `The request failed. Please try again later. If the problem persists, please contact the support team.`,
            }),
          ],
        },
      }
    }

    const info = data.map((invest) => {
      const decimals = invest.to_underlying_token.decimals
      const tokenAmount =
        Number(invest.to_underlying_token?.balance) / 10 ** decimals
      const amount = `${formatTokenDigit(tokenAmount)} ${
        invest.to_underlying_token.symbol
      }`
      const apy = `${formatTokenDigit(invest.apy)}%`
      const usdWorth = `$${formatUsdDigit(invest.underlying_usd)}`
      const platform = invest.platform.name || ""
      const symbol = invest.to_underlying_token?.symbol || ""

      return {
        emoji: getEmoji(symbol as TokenEmojiKey),
        amount,
        usdWorth,
        platform: platform,
        apy: apy,
      }
    })

    const { segments } = formatDataTable(info, {
      cols: ["amount", "usdWorth", "platform", "apy"],
      rowAfterFormatter: (f, i) => `${info[i].emoji}${f}${getEmoji("GIFT")}`,
      separator: [` ${APPROX} `, VERTICAL_BAR, VERTICAL_BAR],
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Invest Portfolio", getEmojiURL(emojis.BANK)],
            description: `${segments.map((c) => c.join("\n"))}`,
          }),
        ],
      },
    }
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default slashCmd
