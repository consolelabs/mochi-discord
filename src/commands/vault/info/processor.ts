import config from "adapters/config"
import CacheManager from "cache/node-cache"
import { formatView, getButtons } from "commands/balances/index/processor"
import {
  ButtonInteraction,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  MessageAttachment,
} from "discord.js"
import { InternalError, OriginalMessage } from "errors"
import { APIError } from "errors"
import { composeEmbedMessage2 } from "ui/discord/embed"
import {
  EmojiKey,
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  isAddress,
  msgColors,
  shortenHashOrAddress,
  TokenEmojiKey,
} from "utils/common"
import { HOMEPAGE_URL, VERTICAL_BAR } from "utils/constants"
import { formatUsdDigit } from "utils/defi"
import {
  getDiscordRenderableByProfileId,
  getProfileIdByDiscord,
} from "utils/profile"
import mochiPay from "adapters/mochi-pay"
import moment from "moment"
import { utils } from "@consolelabs/mochi-formatter"
import { drawLineChart } from "utils/chart"

const getPnlIcon = (n: number) => (n >= 0 ? ":green_circle:" : ":red_circle:")

const formatDate = (d: Date) =>
  `${d.getUTCDate()}.${d.getUTCMonth() + 1}.${d.getUTCFullYear()}`

export async function handleVaultRounds(
  vaultId: string,
  interaction: ButtonInteraction,
) {
  const profileId = await getProfileIdByDiscord(interaction.user.id)
  const {
    data,
    ok,
    curl,
    error,
    originalError,
    log,
    status = 500,
  } = await mochiPay.getTradeRounds(profileId, vaultId)
  if (!ok) {
    if (status === 400 && originalError) {
      throw new InternalError({
        msgOrInteraction: interaction,
        title: "Command error",
        description: originalError,
      })
    }
    throw new APIError({ curl, error, description: log, status })
  }

  const embed = composeEmbedMessage2(interaction as any, {
    color: msgColors.BLUE,
    author: ["All rounds", getEmojiURL(emojis.CALENDAR)],
    description: data
      ?.map((r: any, i: number) =>
        [
          `${getEmoji(`NUM_${i + 1}` as any)} **${formatDate(
            new Date(r?.start_date),
          )} - ${formatDate(new Date(r?.end_date))}**`,
          `${getEmoji("ANIMATED_COIN_1")} Init: $${utils.formatUsdPriceDigit({
            value: r?.initial_balance ?? 0,
            shorten: false,
          })}, 💰 Realized: $${utils.formatUsdPriceDigit({
            value: r?.realized_pnl ?? 0,
            shorten: false,
          })}, total of ${r?.trade_count ?? 0} trade(s)`,
          `You claimed **$${r?.claimed ?? 0}** this round`,
        ].join("\n"),
      )
      .join("\n\n"),
  })

  return {
    context: {
      vaultId,
      vaultType: "trading",
    },
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .addOptions(
              data?.map((r: any, i: number) => ({
                label: `${formatDate(new Date(r?.start_date))} - ${formatDate(
                  new Date(r?.end_date),
                )}`,
                value: r?.id,
                emoji: getEmoji(`NUM_${i + 1}` as any),
              })),
            )
            .setPlaceholder("Select a round")
            .setCustomId("select_round"),
        ),
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel("Claim all")
            .setStyle("SECONDARY")
            .setCustomId("claim")
            .setEmoji("<:FeelsGood:1177549805048836126>")
            .setDisabled(true),
        ),
      ],
    },
  }
}

export async function vaultReport(
  interaction: ButtonInteraction,
  report: any,
  vaultId: string,
) {
  const basicInfo = [
    `<:Look:1150701811536248865> \`Positions. \` Open ${report.total_open_trade} / Close ${report.total_closed_trade}`,
    `${getEmoji("CASH")} \`Init. \` ${utils.formatUsdPriceDigit({
      value: report.first_initial_balance,
      shorten: false,
    })}`,
    `:dart: \`PnL. \` ${utils.formatUsdPriceDigit({
      value: report.total_pnl,
      shorten: false,
    })} (${getPnlIcon(report.total_pnl)} ${utils.formatPercentDigit(
      report.total_realized_pl * 100,
    )})`,
  ].join("\n")

  const { open_trades, close_trades } = report
  const openTrades = open_trades
    ? [
        `**Open trades (${report.total_open_trade})**`,
        `\`${formatDate(new Date(open_trades.opened_time))}\` ${getEmoji(
          "ANIMATED_COIN_1",
        )} Init: ${utils.formatUsdPriceDigit({
          value: open_trades.initial_balance,
          shorten: false,
        })} 💰 Current: ${utils.formatUsdPriceDigit({
          value: open_trades.unrealized_pnl,
          shorten: false,
        })} (${getPnlIcon(
          open_trades.unrealized_pl,
        )} ${utils.formatPercentDigit(open_trades.unrealized_pl * 100)})`,
      ].join("\n") + "\n\n"
    : ""

  const description = composeTradesDescription({
    description: `${basicInfo}\n\n${openTrades}`,
    trades: close_trades,
    total: report.total_closed_trade,
  })
  const embed = composeEmbedMessage2(interaction as any, {
    color: msgColors.BLUE,
    author: ["Trading vault report", getEmojiURL(emojis.ANIMATED_DIAMOND)],
    description,
  })
  return {
    context: { vaultId, vaultType: "trading" },
    msgOpts: {
      embeds: [embed],
      components: [],
    },
  }
}

function composeTradesDescription({
  description,
  trades,
  total,
}: {
  description: string
  trades: any[]
  total: number
}) {
  // Discord embed description is limited to 4096 characters
  const MAX_CHARS = 4096
  const closeTrades = trades?.length
    ? [
        `**Closed trades (${total})**`,
        ...trades.map(
          (t: any) =>
            `\`${formatDate(new Date(t.closed_time))}\` ${getEmoji(
              "WAVING_HAND",
            )} Init: ${utils.formatUsdPriceDigit({
              value: t.initial_balance,
              shorten: false,
            })} 💰 PnL: ${utils.formatUsdPriceDigit({
              value: t.realized_pnl ?? 0,
              shorten: false,
            })} (${getPnlIcon(t.realized_pl)} ${utils.formatPercentDigit(
              t.realized_pl * 100,
            )})`,
        ),
      ].join("\n")
    : ""

  const final = `${description}${closeTrades}`
  const allRenderable = final.length <= MAX_CHARS && trades.length === total
  // all closed trades can be rendereable without exceeding limit
  if (allRenderable) {
    return final
  }

  // can render only portion of closed trades, add sub text (e.g. and 2 more trades ...)
  if (final.length <= MAX_CHARS) {
    const unrenderableTrades = total - trades.length
    const alternative = `${final}\n_... and ${unrenderableTrades} more ${
      unrenderableTrades > 1 ? "trades" : "trade"
    } ..._`
    if (alternative.length <= MAX_CHARS) return alternative
  }

  return composeTradesDescription({
    description,
    trades: trades.slice(0, -1),
    total,
  })
}

function getVaultEquityEmoji(percent: string | number = 0) {
  const p = Number(percent)
  if (p <= 20) return "🦀"
  if (p <= 50) return "🐙"
  if (p <= 70) return "🐬"
  if (p <= 90) return "🦈"

  return "🐳"
}

export async function runGetVaultDetail({
  interaction,
  selectedVault,
  vaultType = "spot",
  roundId,
}: {
  interaction: OriginalMessage
  selectedVault: string
  vaultType?: string
  roundId?: string
}) {
  // trading vault
  if (vaultType === "trading" && "user" in interaction) {
    const profileId = await getProfileIdByDiscord(interaction.user.id)
    const {
      data,
      ok,
      curl,
      error,
      originalError,
      log,
      status = 500,
    } = await mochiPay.getEarningVault(profileId, selectedVault, { roundId })
    if (!ok) {
      if (status === 400 && originalError) {
        throw new InternalError({
          msgOrInteraction: interaction,
          title: "Command error",
          description: originalError,
        })
      }
      throw new APIError({ curl, error, description: log, status })
    }

    const creator = await getDiscordRenderableByProfileId(profileId)
    const { investor_report: report } = data
    const { open_trades, close_trades } = report
    const basicInfo = [
      `${getEmoji("ANIMATED_VAULT", true)}\`Name.    \` ${data.name}`,
      `${getEmoji("ANIMATED_VAULT_KEY", true)}\`Creator. \`${creator}`,
      `${getEmoji("CALENDAR")}\`Created. \` ${formatDate(
        new Date(data.created_at),
      )}`,
      `${getEmoji("ANIMATED_BADGE_1")}\`Tier.    \` ${report.account_tier}`,
      `${getEmoji("CASH")}\`Balance. \` ${utils.formatUsdPriceDigit({
        value: report.current_balance,
        shorten: false,
      })}`,
      `${getEmoji("ANIMATED_VAULT_KEY")}\`Key.     \` ${shortenHashOrAddress(
        report.account_id,
        5,
        5,
      )}`,
    ].join("\n")

    const startRound = moment(new Date(report.opened_trade_round_time))
    const roundFields = [
      `**Round info**`,
      `${getEmoji("CALENDAR")} \`Date.      \` ${formatDate(
        startRound.toDate(),
      )}, ${report.remaining}`,
      `${getPnlIcon(
        report.total_pnl,
      )} \`Acc. PnL.  \` ${utils.formatUsdPriceDigit({
        value: report.total_pnl,
        shorten: false,
      })} (${utils.formatPercentDigit(report.total_realized_pl * 100)})`,
      `🏎️ \`Rounds.    \` ${report.trade_round_no}`,
      `🎫 \`Total fee. \` ${utils.formatUsdPriceDigit({
        value: report.total_fee,
        shorten: false,
      })}`,
    ].join("\n")

    let share = report.vault_equity.stake_percent
    let claiambleInfo = utils.formatUsdPriceDigit({
      value: Number(report.vault_equity.claimable ?? 0),
      shorten: false,
    })
    if (report.member_equity) {
      const { claimable, claimable_usd, token_symbol } = report.member_equity
      share = report.member_equity.share * 100
      claiambleInfo = `${utils.formatTokenDigit(
        claimable,
      )} ${token_symbol} (≈ ${utils.formatUsdPriceDigit({
        value: claimable_usd,
        shorten: false,
      })})`
    }

    const vaultEquity = [
      "**Vault equity**",
      `${getVaultEquityEmoji(
        share,
      )} \`Your share.       \` ${utils.formatPercentDigit({
        value: Number(share),
        fractionDigits: 4,
      })}`,
      `${getEmoji("GIFT")} \`Floating profit.  \` ${utils.formatUsdPriceDigit({
        value: Number(report.vault_equity.floating_profit ?? 0),
        shorten: false,
      })}`,
      `:tada: \`Claimable amount. \` ${claiambleInfo}`,
    ].join("\n")

    const openTrades = open_trades
      ? [
          `**Open trades (${report.total_open_trade})**`,
          `\`${formatDate(new Date(open_trades.opened_time))}\` ${getEmoji(
            "ANIMATED_COIN_1",
          )} Init: ${utils.formatUsdPriceDigit({
            value: open_trades.initial_balance,
            shorten: false,
          })} 💰 Current: ${utils.formatUsdPriceDigit({
            value: open_trades.unrealized_pnl,
            shorten: false,
          })} (${getPnlIcon(
            open_trades.unrealized_pl,
          )} ${utils.formatPercentDigit(open_trades.unrealized_pl * 100)})`,
        ].join("\n") + "\n\n"
      : ""

    const address = [
      "**Vault address**",
      `${getEmoji("EVM")}\`EVM | ${shortenHashOrAddress(
        data.evm_wallet_address,
      )}\``,
      `${getEmoji("SOL")}\`SOL | ${shortenHashOrAddress(
        data.solana_wallet_address,
      )}\``,
    ].join("\n")

    // add chart Pnl
    const latestTrade = open_trades ?? close_trades?.[0]

    if (!latestTrade) {
      throw new InternalError({
        msgOrInteraction: interaction,
        title: "No Trading Data",
        description: originalError,
      })
    }

    const dataPnl = await mochiPay.getInvestorPnls(profileId, selectedVault, {
      trade_set_id: latestTrade.id!,
    })
    if (!dataPnl?.length) {
      throw new InternalError({
        msgOrInteraction: interaction,
        title: "No Pnl Data",
        description: originalError,
      })
    }

    // if current minute > 10, pnl snapshot might be outdated
    const outdatable = new Date().getMinutes() > 10
    const hasOpenTrade = latestTrade.status === 1
    if (outdatable && hasOpenTrade) {
      dataPnl.push({
        time: new Date().toISOString(),
        sum_pnl: Number(latestTrade.unrealized_pnl!),
        account_id: "",
        account_trade_set_id: undefined,
        realized_pnl: 0,
        unrealized_pnl: 0,
      })
    }

    // draw chart pnl
    const labels = dataPnl.map((r: { time: string | undefined }, i: any) =>
      formatDateTime(r.time),
    )
    const buffer = await drawLineChart({
      title: "PNL (USD)",
      labels,
      data: dataPnl.map((r: { sum_pnl: any }) => r.sum_pnl || 0),
    })
    const description = composeTradesDescription({
      description: `${basicInfo}\n\n${vaultEquity}\n\n${address}\n\n${roundFields}\n\n${openTrades}`,
      trades: close_trades,
      total: report.total_closed_trade,
    })
    const embed = composeEmbedMessage2(interaction as any, {
      color: msgColors.BLUE,
      author: ["Trading vault info", getEmojiURL(emojis.ANIMATED_DIAMOND)],
      description,
      image: "attachment://chart_pnl.png",
    })

    return {
      context: {
        deposit: {
          evm: data.evm_wallet_address,
          sol: data.solana_wallet_address,
        },
        vaultId: selectedVault,
        report,
      },
      msgOpts: {
        embeds: [embed],
        files: [new MessageAttachment(buffer, "chart_pnl.png")],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setLabel("Claim")
              .setStyle("SECONDARY")
              .setCustomId("claim")
              .setEmoji("<:FeelsGood:1177549805048836126>")
              .setDisabled(Number(report.vault_equity.claimable ?? 0) > 0),
            new MessageButton()
              .setLabel("Report")
              .setEmoji(getEmoji("CHART"))
              .setStyle("SECONDARY")
              .setCustomId("report"),
            new MessageButton()
              .setLabel("All rounds")
              .setEmoji(getEmoji("CALENDAR"))
              .setStyle("SECONDARY")
              .setCustomId("rounds"),
          ),
        ],
      },
    }
  }

  // spot vault
  const {
    data,
    ok,
    curl,
    error,
    originalError,
    log,
    status = 500,
  } = await config.getVaultDetail(selectedVault, interaction.guildId || "")
  if (!ok) {
    if (status === 400 && originalError) {
      throw new InternalError({
        msgOrInteraction: interaction,
        title: "Command error",
        description: originalError,
      })
    }
    throw new APIError({ curl, error, description: log, status })
  }

  data.recent_transaction = data.recent_transaction.slice(0, 5)

  const walletAddress =
    data.wallet_address !== ""
      ? `**Wallet Address**\n${getEmoji("EVM")}\`EVM | ${shortenHashOrAddress(
          data.wallet_address,
          5,
          5,
        )}\`\n${getEmoji("SOL")}\`SOL | ${shortenHashOrAddress(
          data.solana_wallet_address,
          5,
          5,
        )}\``
      : ""

  const titleCurrentRequest = `**Current request**\n`
  let currentRequest = ""
  data.current_request.reverse().forEach((request: any) => {
    currentRequest += formatCurrentRequest(request)
  })
  currentRequest = currentRequest ? titleCurrentRequest + currentRequest : ""

  let fields = []

  // TODO: remove hardcode 1
  const { totalWorth, text: tokenBalanceBreakdownText } = formatView(
    "compact",
    "filter-dust",
    data.balance,
    0,
  )
  const myNftTitleFields = buildMyNftTitleFields(data)
  const myNftFields = buildMyNftFields(data)
  const treasurerFields = buildTreasurerFields(data)
  const recentTxFields = await buildRecentTxFields(data)

  fields = [
    ...(tokenBalanceBreakdownText
      ? [
          {
            name: "Tokens",
            value: tokenBalanceBreakdownText + "\u200b",
            inline: false,
          },
        ]
      : []),
  ]
    .concat(myNftTitleFields)
    .concat(myNftFields)
    .concat(treasurerFields)
    .concat(recentTxFields)

  const creator = data.treasurer.find((t: any) => t.role === "creator") ?? ""
  const basicInfo = [
    `${getEmoji("ANIMATED_VAULT", true)}\`Name. ${selectedVault}\``,
    `${getEmoji("CHECK")}\`Approve threshold. ${data.threshold ?? 0}%\``,
    `${getEmoji("ANIMATED_VAULT_KEY", true)}\`Creator. \`${
      creator.user_discord_id ? `<@${creator.user_discord_id}>` : ""
    }`,
    `${getEmoji("CASH")}\`Total Balance. $${formatUsdDigit(
      String(totalWorth) || "0",
    )}\``,
  ].join("\n")
  const embed = composeEmbedMessage2(interaction as any, {
    color: msgColors.BLUE,
    author: ["Vault info", getEmojiURL(emojis.ANIMATED_DIAMOND)],
    description: `${basicInfo}\n\n${walletAddress}\n${currentRequest}`,
  }).addFields(fields)

  return {
    context: {
      deposit: {
        evm: data.wallet_address,
        sol: data.solana_wallet_address,
      },
    },
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          ...getButtons(),
          new MessageButton()
            .setStyle("SECONDARY")
            .setEmoji(getEmoji("CONFIG"))
            .setCustomId("vault_info_setting")
            .setLabel("Setting"),
        ),
      ],
    },
  }
}

function formatCurrentRequest(request: any) {
  let target =
    request.address === ""
      ? "Mochi Wallet"
      : `\`${shortenHashOrAddress(request.address)}\``

  if (request.target) {
    target = `<@${request.target}>`
  }

  switch (request.action) {
    case "Add":
      return `${getEmoji("CHECK")} [[${request.total_approved_submission}/${
        request.total_submission
      }]](${HOMEPAGE_URL}) Add <@${request.target}> as vault treasurer\n`
    case "Remove":
      return `${getEmoji("CHECK")} [[${request.total_approved_submission}/${
        request.total_submission
      }]](${HOMEPAGE_URL}) Remove <@${request.target}> from the vault\n`
    case "Transfer":
      return `${getEmoji("CHECK")} [[${request.total_approved_submission}/${
        request.total_submission
      }]](${HOMEPAGE_URL}) Send ${target} ${request.amount} ${getEmojiToken(
        request.token.toUpperCase() as TokenEmojiKey,
      )} ${request.token.toUpperCase()}\n`
  }
}

CacheManager.init({
  pool: "vault-recent-txns",
  ttl: 300,
  checkperiod: 300,
})

async function formatRecentTransaction(tx: any) {
  const date = new Date(tx.date)
  const t = utils.time.relativeShort(date)
  const amount = ["+", "-"].includes(tx.amount?.split("")[0])
    ? tx.amount.slice(1)
    : tx.amount
  const token = tx.token?.toUpperCase()
  const tokenEmoji = getEmojiToken(token)
  switch (tx.action) {
    case "Received": {
      const profileId = tx.target
      let from = `${await getDiscordRenderableByProfileId(profileId)}`
      if (!profileId) {
        from = ""
      } else if (!isAddress(profileId).valid) {
        from = await CacheManager.get({
          pool: "vault-recent-txns",
          key: profileId,
          call: async () => await getDiscordRenderableByProfileId(profileId),
        })
      }

      return {
        time: t,
        text: `${tokenEmoji} +${amount} ${token}${from ? ` from ${from}` : ""}`,
      }
    }
    case "Add":
      return {
        time: t,
        text: `${getEmoji("TREASURER_ADD")} Add <@${
          tx.target
        }> as vault treasurer `,
      }
    case "Remove":
      return {
        time: t,
        text: `${getEmoji("TREASURER_REMOVE")} Remove <@${
          tx.target
        }> from the vault`,
      }
    case "Config threshold":
      return {
        time: t,
        text: `${getEmoji("ANIMATED_VAULT_KEY", true)} Set the threshold to ${
          tx.threshold
        }% for vault`,
      }
    case "Sent":
    case "Transfer": {
      const profileId = tx.target
      let to = `${await getDiscordRenderableByProfileId(profileId)}\``
      if (!profileId) {
        to = ""
      } else if (!isAddress(profileId).valid) {
        to = await CacheManager.get({
          pool: "vault-recent-txns",
          key: profileId,
          call: async () => await getDiscordRenderableByProfileId(profileId),
        })
      }

      return {
        time: t,
        text: `${tokenEmoji} -${amount} ${token}${to ? ` to ${to}` : ""}`,
      }
    }
    case "Swap": {
      const fromToken = tx.from_token.toUpperCase()
      const fromTokenEmoji = getEmojiToken(fromToken)
      const toToken = tx.to_token.toUpperCase()
      const toTokenEmoji = getEmojiToken(toToken)
      const emojiSwap = getEmoji("SWAP_ROUTE")
      return {
        time: t,
        text: `${fromTokenEmoji} -${tx.amount_in} ${fromToken} ${emojiSwap} ${toTokenEmoji} +${tx.amount_out} ${toToken}`,
      }
    }
  }
}

function buildMyNftTitleFields(data: any): any {
  let totalNft = 0
  for (let i = 0; i < data.my_nft.length; i++) {
    totalNft += data.my_nft[i].total
  }

  if (totalNft === 0) {
    return []
  }

  return [
    {
      name: `My NFT (${totalNft})`,
      value: "\u200b",
      inline: false,
    },
  ]
}

function buildMyNftFields(data: any): any {
  const resMyNft = data.my_nft.map((nft: any) => {
    let nftElements = ""
    for (let i = 0; i < nft.nft.length; i++) {
      nftElements += `${nft.nft[i].name} #${nft.nft[i].id}\n`
    }
    return {
      name: `${getEmoji(`VAULT_NFT`)} ${nft.collection_name} (${nft.chain}) ${
        nft.total
      }`,
      value: `${nftElements === "" ? "\u200b" : nftElements}`,
      inline: true,
    }
  })
  const myNftFields = []
  for (let i = 0; i < resMyNft.length; i++) {
    if (i !== 0 && i % 2 == 0) {
      myNftFields.push({
        name: "\u200b",
        value: "\u200b",
        inline: true,
      })
    }
    myNftFields.push(resMyNft[i])
  }
  return myNftFields
}

export async function buildRecentTxFields(data: any) {
  const formatted = await Promise.all(
    data.recent_transaction
      .filter(
        (tx: {
          token: string | any[]
          from_token: string | any[]
          to_token: string | any[]
        }) =>
          tx.token?.length <= 10 ||
          tx.from_token?.length <= 10 ||
          tx.to_token?.length <= 10,
      )
      .map((tx: any) => formatRecentTransaction(tx)),
  )

  if (!formatted.length) return []
  const value = utils.mdTable(formatted, {
    cols: ["time", "text"],
    alignment: ["left", "left"],
    separator: [VERTICAL_BAR],
    wrapCol: [true, false],
  })
  return [
    {
      name: `Recent Transactions`,
      value: value,
      inline: false,
    },
  ]
}

export function buildTreasurerFields(data: any): any {
  let valueTreasurer = ""
  for (let i = 0; i < data.treasurer.length; i++) {
    const treasurer = data.treasurer[i]
    valueTreasurer += `${getEmoji(`NUM_${i + 1}` as EmojiKey)} <@${
      treasurer.user_discord_id
    }>${treasurer.role === "creator" ? " (creator)" : ""}\n`
  }
  if (valueTreasurer) {
    return [
      {
        name: `Treasurer (${data.treasurer.length})`,
        value: valueTreasurer,
        inline: false,
      },
    ]
  }
  return []
}

function formatDateTime(s: string | undefined, timeOnly?: boolean) {
  if (!s) return "N/A"
  const d = new Date(s)
  return `${
    timeOnly
      ? ""
      : `${d.toLocaleDateString("en-US", { day: "numeric", month: "short" })}, `
  }${d
    .toLocaleTimeString("en-US", { hour12: true, hour: "numeric" })
    .replace(" ", "")}`
}
