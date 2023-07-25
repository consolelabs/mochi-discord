import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import {
  composeEmbedMessage,
  formatDataTable,
  getErrorEmbed,
} from "ui/discord/embed"
import mochiPay from "adapters/mochi-pay"
import { getProfileIdByDiscord } from "utils/profile"
import { emojis, getEmojiURL, msgColors } from "utils/common"
import { formatTokenDigit } from "utils/defi"
import { convertString } from "utils/convert"

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
  name: "transaction",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("transaction")
      .setDescription("check your invest transaction transaction")
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

    const filterStake = data
      .filter((item: InvestRequest) => item.action === "stake")
      .slice(0, 5)
    const stake = formatDataTable(
      filterStake.map((s: InvestRequest) => ({
        token: `- ${formatTokenDigit(
          convertString(
            s.token_amount,
            s.token?.decimal ?? 18,
            false
          ).toString()
        )} ${s.token?.symbol?.toUpperCase() ?? "TOKEN"}`,
        pool: s.platform ?? "Unknown",
        status: s.status,
      })),
      { cols: ["token", "pool", "status"], noWrap: true }
    ).joined

    const filterUnStake = data
      .filter((item: InvestRequest) => item.action === "unstake")
      .slice(0, 5)
    const unStake = formatDataTable(
      filterUnStake.map((s: InvestRequest) => ({
        token: `+ ${formatTokenDigit(
          convertString(
            s.token_amount,
            s.token?.decimal ?? 18,
            false
          ).toString()
        )} ${s.token?.symbol?.toUpperCase() ?? "TOKEN"}`,
        pool: s.platform ?? "Unknown",
        status: s.status,
      })),
      { cols: ["token", "pool", "status"], noWrap: true }
    ).joined

    const filterClaimRewards = data
      .filter((item: InvestRequest) => item.action === "claim_reward")
      .slice(0, 5)
    const claimRewards = formatDataTable(
      filterClaimRewards.map((s: InvestRequest) => ({
        token: `+ ${formatTokenDigit(
          convertString(
            s.token_amount,
            s.token?.decimal ?? 18,
            false
          ).toString()
        )} ${s.token?.symbol?.toUpperCase() ?? "TOKEN"}`,
        pool: s.platform ?? "Unknown",
        status: s.status,
      })),
      { cols: ["token", "pool", "status"], noWrap: true }
    ).joined

    const fields = [
      ...(stake.length
        ? [
            {
              name: "Stake",
              value: `\`\`\`diff\n${stake}\`\`\``,
              inline: false,
            },
          ]
        : []),
      ...(unStake.length
        ? [
            {
              name: "Unstake",
              value: `\`\`\`diff\n${unStake}\`\`\``,
              inline: false,
            },
          ]
        : []),
      ...(claimRewards.length
        ? [
            {
              name: "Claim rewards",
              value: `\`\`\`diff\n${claimRewards}\`\`\``,
              inline: false,
            },
          ]
        : []),
    ]

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            color: msgColors.BLUE,
            author: [
              "Invest Transaction History",
              getEmojiURL(emojis.TRANSACTIONS),
            ],
          }).addFields(fields),
        ],
      },
    }
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default slashCmd
