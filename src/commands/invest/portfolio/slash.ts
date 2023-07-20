import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import community from "adapters/community"
import {
  composeEmbedMessage,
  composeEmbedMessage2,
  formatDataTable,
  getErrorEmbed,
} from "ui/discord/embed"
import mochiPay from "adapters/mochi-pay"
import { getProfileIdByDiscord } from "utils/profile"
import { VERTICAL_BAR } from "utils/constants"
import { ResponseInvestPlatforms } from "types/api"
import { getEmoji } from "utils/common"
import { getSlashCommand } from "utils/commands"

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

    // error
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

    // no data
    if (!data) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage2(i, {
              title: "Your earning portfolio is empty",
              description: `You have not invested in any earning platform yet.\n${getEmoji(
                "ANIMATED_POINTING_RIGHT",
                true
              )}You can invest in earning platform by using ${await getSlashCommand(
                "invest stake"
              )}`,
            }),
          ],
        },
      }
    }

    // data
    const { segments } = formatDataTable(
      [
        {
          chainID: "ChainID",
          platform: "Platform",
          token: "Token",
          amount: "Amount",
          apy: "APY",
        },
        ...data.map((invest) => {
          const decimals = invest.to_underlying_token.decimals
          const tokenAmount = (
            Number(invest.to_underlying_token?.balance) /
            10 ** decimals
          ).toFixed(2)
          return {
            chainID: invest.chain_id,
            platform: invest.platform.name ?? "NA",
            token: `${invest.to_underlying_token.symbol}`,
            amount: tokenAmount,
            apy: `${invest.apy.toFixed(2)}%`,
          }
        }),
      ],
      {
        cols: ["chainID", "platform", "token", "amount", "apy"],
        separator: [VERTICAL_BAR],
      }
    )

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "Invest Portfolio",
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
