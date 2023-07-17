import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import community from "adapters/community"
import { ApiEarningOption, ApiPlatform } from "types/krystal-api"
import {
  composeEmbedMessage,
  formatDataTable,
  getErrorEmbed,
} from "ui/discord/embed"
import { shortenHashOrAddress } from "utils/common"
import mochiPay from "adapters/mochi-pay"
import { getProfileIdByDiscord } from "utils/profile"
import { VERTICAL_BAR } from "utils/constants"
import { BigNumber } from "ethers"

type InvestBalance = {
  apy: number
  chain_id: number
  platform: ApiPlatform
  ratio: number
  reward_apy: number
  staking_token: {
    address: string
    balance: string
    decimals: number
    logo: string
    name: string
    symbol: string
  }
  to_underlying_token: {
    address: string
    balance: string
    decimals: number
    logo: string
    name: string
    symbol: string
  }
  underlying_usd: number
}

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
          .setName("token")
          .setDescription("filter earn by token")
          .setRequired(false)
          .setAutocomplete(true)
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
    const focused = i.options.getFocused(true)

    if (focused.name === "token") {
      const focusedValue = focused.value
      const chainId = i.options.getString("chain", true)

      const { result } = await community.getEarns({
        chainIds: chainId,
        types: "lend", // get lend only
        status: "active",
      })

      const options = result
        .filter((opt: ApiEarningOption) =>
          opt.token?.symbol?.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .slice(0, 25)
        .map((opt: ApiEarningOption) => ({
          name: `${opt.token?.symbol} ${shortenHashOrAddress(
            opt.token?.address ?? ""
          )}`,
          value: `${opt.token?.name}|${opt.token?.address}`,
        }))

      await i.respond(options)
    }

    if (focused.name === "platform") {
      const focusedValue = focused.value
      const chainId = i.options.getString("chain", true)
      const token = i.options.getString("token", true)
      const address = token.split("|")[1]

      const { result } = await community.getEarns({
        chainIds: chainId,
        address,
        types: "lend", // get lend only
        status: "active",
      })

      if (!result) {
        await i.respond([])
        return
      }
      const formatter = Intl.NumberFormat("en-US", {
        maximumFractionDigits: 1,
        notation: "compact",
      })
      const platforms = result[0].platforms
      const options = platforms
        .filter((p: ApiPlatform) =>
          p?.name?.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .map((p: ApiPlatform) => ({
          name: `[${p.name?.toUpperCase()}] APY: ${p.apy?.toFixed(
            2
          )}% - TVL: ${formatter.format(p.tvl ?? 0)}`,
          value: p.name,
        }))

      await i.respond(options)
    }
  },
  run: async function (i: CommandInteraction) {
    const chainId = i.options.getString("chain")
    const [_, tokenAddress] = i.options.getString("token")?.split("|") ?? [
      "",
      "",
    ]
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

    const { segments } = formatDataTable(
      [
        {
          chainID: "ChainID",
          platform: "Platform",
          token: "Token",
          amount: "Amount",
          apy: "APY",
        },
        ...data.map((invest: InvestBalance) => {
          const decimals = invest.to_underlying_token.decimals
          const tokenAmount = (
            Number(invest.to_underlying_token.balance) /
            10 ** decimals
          ).toFixed(2)
          return {
            chainID: invest.chain_id,
            platform: invest.platform.name,
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
