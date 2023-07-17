import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import {
  composeEmbedMessage,
  formatDataTable,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import mochiPay from "adapters/mochi-pay"
import { getProfileIdByDiscord } from "utils/profile"
import { VERTICAL_BAR } from "utils/constants"

type InvestRequest = {
  id: number
  profile_id: string
  token_amount: string
  tx_hash: string
  platform: string
  action: string
  status: string
  chain_id: string
  token?: {
    id: string
    name: string
    symbol: string
    decimal: number
    chain_id: string
    chain: {
      chain_id: string
      name: string
      symbol: string
    }
  }
}

const slashCmd: SlashCommand = {
  name: "status",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("status")
      .setDescription("check your invest transaction status")
  },
  run: async function (i: CommandInteraction) {
    const profileId = await getProfileIdByDiscord(i.user.id)

    const { ok, data } = await mochiPay.getKrystalEarnHistory({
      profile_id: profileId,
      size: 10, // get last 10 transactions
    })

    if (!ok) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Failed to get transaction history",
              description: `The transaction failed. Please try again later. If the problem persists, please contact the support team.`,
            }),
          ],
        },
      }
    }

    const { segments } = formatDataTable(
      [
        {
          id: "ID",
          chain: "Chain",
          action: "Action",
          token: "Token",
          amount: "Amount",
          status: "Status",
        },
        ...data.map((item: InvestRequest) => {
          const decimals = item.token?.decimal ?? 18
          const tokenAmount = item.token
            ? `${Number(item.token_amount) / 10 ** decimals}`
            : ""
          return {
            id: item.id,
            chain: item.token?.chain.name ?? item.chain_id,
            action: item.action,
            token: item.token?.symbol ?? "",
            amount: tokenAmount,
            status: item.status,
          }
        }),
      ],
      {
        cols: ["id", "chain", "action", "token", "amount", "status"],
        separator: [VERTICAL_BAR],
      }
    )

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "Invest Transaction History",
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
