import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import api from "api"
import UI, { Platform, utils as mochiUtils } from "@consolelabs/mochi-ui"
import { utils } from "ethers"
import { APPROX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { getEmoji, thumbnails } from "utils/common"

async function mostSpend(stats: any) {
  const topSpendToken = [
    `**Top ${stats.spending.length} spent token${
      stats.spending.length > 1 ? "s" : ""
    }**`,
    mochiUtils.mdTable(
      stats.spending.map((spend: any) => ({
        token: `${mochiUtils.formatTokenDigit(
          utils.formatUnits(spend.amount, spend.token.decimal),
        )} ${spend.token.symbol}`,
        amount: mochiUtils.formatUsdDigit(spend.usd_amount),
      })),
      {
        cols: ["token", "amount"],
        separator: [` ${APPROX} `],
        row: (f, i) => `${getEmoji(stats.spending[i].token.symbol)} ${f}`,
      },
    ),
  ]

  const [to] = await UI.resolve(
    Platform.Discord,
    stats.most_send?.other_profile_id,
  )

  const empty = !stats.spending.length && !to?.value

  return {
    highlight: `\\🔹 You sent the most **${stats.most_send?.token.symbol}**${
      to?.value ? ` to ${to.value}` : ""
    }`,
    text: [
      ...(stats.spending.length ? topSpendToken : []),
      ...(empty
        ? [
            "\nMochi couldn't query the data, please contact the team for further support",
          ]
        : []),
    ].join("\n"),
  }
}

async function mostReceive(stats: any) {
  const topReceiveToken = [
    `**Top ${stats.receive.length} received token${
      stats.receive.length > 1 ? "s" : ""
    }**`,
    mochiUtils.mdTable(
      stats.receive.map((receive: any) => ({
        token: `${mochiUtils.formatTokenDigit(
          utils.formatUnits(receive.amount, receive.token.decimal),
        )} ${receive.token.symbol}`,
        amount: mochiUtils.formatUsdDigit(receive.usd_amount),
      })),
      {
        cols: ["token", "amount"],
        separator: [` ${APPROX} `],
        row: (f, i) => `${getEmoji(stats.receive[i].token.symbol)}${f}`,
      },
    ),
  ]

  const [from] = await UI.resolve(
    Platform.Discord,
    stats.most_receive?.other_profile_id,
  )

  const empty = !stats.receive.length && !from?.value

  return {
    highlight: `\\🔸 You received most **${stats.most_receive?.token.symbol}**${
      from?.value ? ` from ${from.value}` : ""
    }`,
    text: [
      ...(stats.receive.length ? topReceiveToken : []),
      ...(empty
        ? [
            "\nMochi couldn't query the data, please contact the team for further support",
          ]
        : []),
    ].join("\n"),
  }
}

async function history(stats: any) {
  const empty = stats.history.length === 0

  const { text } = await UI.components.txns({
    on: Platform.Discord,
    txns: stats.history,
    withTitle: true,
  })

  return {
    text: [
      ...(empty
        ? [
            "Mochi couldn't query the data, please contact the team for further support",
          ]
        : [text]),
    ].join("\n"),
  }
}

const slashCmd: SlashCommand = {
  name: "recap",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("recap")
      .setDescription("Check monthly stats")
  },
  run: async function (i) {
    const { ok, data: profile } = await api.profile.discord.getById({
      discordId: i.user.id,
      noFetchAmount: true,
    })
    if (!ok) {
      throw new Error("Cannot get user profile")
    }

    const { ok: okStats, data: stats } = await api.pay.profile.stats(profile.id)

    if (!okStats) {
      throw new Error("Cannot get user stats")
    }

    const isNeg = Math.sign(stats.total_volume) < 0
    const isPos = Math.sign(stats.total_volume) > 0

    const { highlight: hlSpend, text: spendText } = await mostSpend(stats)
    const { highlight: hlReceive, text: receiveText } = await mostReceive(stats)
    const { text: historyText } = await history(stats)

    const embed = composeEmbedMessage2(i, {
      author: ["Your last 30 days recap", thumbnails.MOCHI],
      description: [
        isNeg
          ? "\\🔴 You spend more than you receive"
          : isPos
          ? "\\🟢 You receive more than you spend"
          : "Your spend = your receive",
        hlSpend,
        hlReceive,
        getEmoji("BLANK"),
        "**🔍 Details**",
        mochiUtils.mdTable(
          [
            {
              label: "Spending",
              value: mochiUtils.formatUsdDigit(+stats.total_spending * -1),
            },
            {
              label: "Receive",
              value: mochiUtils.formatUsdDigit(stats.total_receive),
            },
            {
              label: "Net",
              value: mochiUtils.formatUsdDigit(stats.total_volume),
            },
          ],
          {
            cols: ["label", "value"],
          },
        ),
        getEmoji("BLANK"),
        spendText,
        getEmoji("BLANK"),
        receiveText,
        getEmoji("BLANK"),
        historyText,
      ].join("\n"),
    })

    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
