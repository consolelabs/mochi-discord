import config from "adapters/config"
import CacheManager from "cache/node-cache"
import { formatView, getButtons } from "commands/balances/index/processor"
import {
  ButtonInteraction,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
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
import { HOMEPAGE_URL } from "utils/constants"
import { formatUsdDigit } from "utils/defi"
import {
  getDiscordRenderableByProfileId,
  getProfileIdByDiscord,
} from "utils/profile"
import { faker } from "@faker-js/faker"
import mochiPay from "adapters/mochi-pay"
import moment from "moment"
import { utils } from "@consolelabs/mochi-formatter"

function formatDate(d: Date) {
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}

const rounds = [
  {
    id: faker.string.uuid(),
    start_date: faker.date.anytime(),
    end_date: faker.date.anytime(),
    initial: faker.finance.amount({ autoFormat: true, symbol: "", dec: 0 }),
    realized_pl: faker.number.float({ min: -100, fractionDigits: 2 }),
    trade_count: faker.number.int({ min: 1, max: 20 }),
    claimed: faker.finance.amount({ min: 0, dec: 0 }),
  },
  {
    id: faker.string.uuid(),
    start_date: faker.date.anytime(),
    end_date: faker.date.anytime(),
    initial: faker.finance.amount({ autoFormat: true, symbol: "", dec: 0 }),
    realized_pl: faker.number.float({ min: -100, fractionDigits: 2 }),
    trade_count: faker.number.int({ min: 1, max: 20 }),
    claimed: faker.finance.amount({ min: 0, dec: 0 }),
  },
  {
    id: faker.string.uuid(),
    start_date: faker.date.anytime(),
    end_date: faker.date.anytime(),
    initial: faker.finance.amount({ autoFormat: true, symbol: "", dec: 0 }),
    realized_pl: faker.number.float({ min: -100, fractionDigits: 2 }),
    trade_count: faker.number.int({ min: 1, max: 20 }),
    claimed: faker.finance.amount({ min: 0, dec: 0 }),
  },
]

export async function vaultRounds(interaction: ButtonInteraction) {
  const embed = composeEmbedMessage2(interaction as any, {
    color: msgColors.BLUE,
    author: ["All rounds", getEmojiURL(emojis.CALENDAR)],
    description: rounds
      .map((r, i) =>
        [
          `${getEmoji(`NUM_${i + 1}` as any)} **${formatDate(
            r.start_date,
          )} - ${formatDate(r.end_date)}**`,
          `${getEmoji("ANIMATED_COIN_1")} Init: $${r.initial}, 💰 Realized: $${
            r.realized_pl
          }, total of ${r.trade_count} trade(s)`,
          `You claimed **$${r.claimed}** this round`,
        ].join("\n"),
      )
      .join("\n\n"),
  })

  return {
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .addOptions(
              rounds.map((r, i) => ({
                label: `${formatDate(r.start_date)} - ${formatDate(
                  r.end_date,
                )}`,
                value: r.id,
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
            .setEmoji("<:FeelsGood:1177549805048836126>"),
        ),
      ],
    },
  }
}

export async function vaultReport(interaction: ButtonInteraction) {
  const basicInfo = [
    `<:Look:1150701811536248865> \`Positions. \` Open 1 / Close 9`,
    `${getEmoji("CASH")} \`Init. \` $11,023.61`,
    `:dart: \`PnL. \` -$586.16 (:red_circle: -5.32%)`,
  ].join("\n")

  const openTrades = [
    "**Open trades**",
    `\`24.05.08\` ${getEmoji(
      "ANIMATED_COIN_1",
    )} Init: $10,410 💰 Current: $22 **(:green_circle: 0.22%)**`,
  ].join("\n")

  const closedTrades = [
    "**Closed trades**",
    `\`24.05.07\` ${getEmoji(
      "WAVING_HAND",
    )} Init: $10,653 💰 PnL: -$247 (:red_circle: -2.32%)`,
    `\`24.05.07\` ${getEmoji(
      "WAVING_HAND",
    )} Init: $10,785 💰 PnL: -$131 (:red_circle: -1.22%)`,
    `\`24.05.07\` ${getEmoji(
      "WAVING_HAND",
    )} Init: $10,802 💰 PnL: -$17 (:red_circle: -0.16%)`,
  ].join("\n")

  const embed = composeEmbedMessage2(interaction as any, {
    color: msgColors.BLUE,
    author: ["Trading vault report", getEmojiURL(emojis.ANIMATED_DIAMOND)],
    description: `${basicInfo}\n\n${openTrades}\n\n${closedTrades}`,
  })
  return {
    msgOpts: {
      embeds: [embed],
      components: [],
    },
  }
}

export async function runGetVaultDetail(
  selectedVault: string,
  interaction: OriginalMessage,
  vaultType = "spot",
) {
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
    } = await mochiPay.getEarningVault(profileId, selectedVault)
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
    const { trade_rounds: rounds, account } = data
    const basicInfo = [
      `${getEmoji("ANIMATED_VAULT", true)}\`Name. ${data.name}\``,
      `${getEmoji("ANIMATED_VAULT_KEY", true)}\`Creator. \`${creator}`,
      `${getEmoji("CALENDAR")}\`Created. \` ${formatDate(
        new Date(data.created_at),
      )}`,
      `${getEmoji("ANIMATED_BADGE_1")}\`Tier. \` ${account.tier.name}`,
      `${getEmoji("CASH")}\`Balance. \`$${formatUsdDigit(account.balance)}`,
      `${getEmoji("ANIMATED_VAULT_KEY")}\`Key. \` ${account.api_key}`,
    ].join("\n")

    const openRound = rounds.find((r: any) => r.status === 1)
    const startDate = moment(new Date(openRound.start_date))
    const startDiff = `${startDate.fromNow(true)} ${
      startDate.isBefore() ? " ago" : " left"
    }`

    const roundFields = [
      `**Round info**`,
      `${getEmoji("CALENDAR")} \`Start. \` ${formatDate(
        startDate.toDate(),
      )}, ${startDiff}`,
      `🟢 \`Acc. PnL. \` ${utils.formatUsdPriceDigit(
        account.accumulative_pnl,
      )} (${utils.formatPercentDigit(account.accumulative_pl * 100)})`,
      `🏎️ \`Rounds. \` ${openRound.no}`,
      `🎫 \`Total fee. \` ${utils.formatUsdPriceDigit(openRound.fee)}`,
    ].join("\n")

    const vaultEquity = [
      "**Vault equity**",
      `${getEmoji("CHART")} \`Your share. \` 100%`,
      `${getEmoji("MONEY")} \`Claimable amount. \` ${utils.formatUsdPriceDigit(
        account.claimable,
      )}`,
    ].join("\n")

    const openTrades = [
      "**Open trades**",
      `\`${formatDate(new Date(openRound.start_date))}\` ${getEmoji(
        "ANIMATED_COIN_1",
      )} Init: ${utils.formatUsdPriceDigit(
        openRound.initial_balance,
      )} 💰 Current: ${utils.formatUsdPriceDigit(openRound.realized_pnl)} **(:${
        openRound.pnl_percentage >= 0 ? "green" : "red"
      }_circle: ${utils.formatPercentDigit(openRound.pnl_percentage)})**`,
    ].join("\n")

    const closedRounds = rounds.filter((r: any) => r.status === 0).slice(0, 3)
    const closedTrades = [
      "**Closed trades**",
      ...closedRounds.map(
        (r: any) =>
          `\`${formatDate(new Date(r.start_date))}\` ${getEmoji(
            "WAVING_HAND",
          )} Init: ${utils.formatUsdPriceDigit(
            r.initial_balance,
          )} 💰 PnL: ${utils.formatUsdPriceDigit(r.realized_pnl ?? 0)} (:${
            r.pnl_percentage >= 0 ? "green" : "red"
          }_circle: ${utils.formatPercentDigit(r.pnl_percentage)})`,
      ),
      // `\`24.05.07\` ${getEmoji(
      //   "WAVING_HAND",
      // )} Init: $10,653 💰 PnL: -$247 (:red_circle: -2.32%)`,
    ].join("\n")

    const address = [
      "**Vault address**",
      `${getEmoji("EVM")}\`EVM | ${shortenHashOrAddress(
        data.evm_wallet_address,
      )}\``,
      `${getEmoji("SOL")}\`SOL | ${shortenHashOrAddress(
        data.solana_wallet_address,
      )}\``,
    ].join("\n")

    const embed = composeEmbedMessage2(interaction as any, {
      color: msgColors.BLUE,
      author: ["Trading vault info", getEmojiURL(emojis.ANIMATED_DIAMOND)],
      description: `${basicInfo}\n\n${vaultEquity}\n\n${address}\n\n${roundFields}\n\n${openTrades}\n\n${
        closedTrades.length > 1 ? closedTrades : ""
      }`,
    })

    return {
      context: {
        deposit: {
          evm: data.evm_wallet_address,
          sol: data.solana_wallet_address,
        },
      },
      msgOpts: {
        embeds: [embed],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setLabel("Claim")
              .setStyle("SECONDARY")
              .setCustomId("claim")
              .setEmoji("<:FeelsGood:1177549805048836126>"),
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
  const t = `<t:${Math.floor(date.getTime() / 1000)}:R>`
  const amount = ["+", "-"].includes(tx.amount?.split("")[0])
    ? tx.amount.slice(1)
    : tx.amount
  const token = tx.token?.toUpperCase()
  const tokenEmoji = getEmojiToken(token)
  switch (tx.action) {
    case "Received": {
      const profileId = tx.target
      let from = `\`${shortenHashOrAddress(profileId)}\``
      if (!profileId) {
        from = ""
      } else if (!isAddress(profileId).valid) {
        from = await CacheManager.get({
          pool: "vault-recent-txns",
          key: profileId,
          call: async () => await getDiscordRenderableByProfileId(profileId),
        })
      }

      return `${t} ${tokenEmoji} +${amount} ${token}${
        from ? ` from ${from}` : ""
      }\n`
    }
    case "Add":
      return `${t} ${getEmoji("TREASURER_ADD")} Add <@${
        tx.target
      }> as vault treasurer\n`
    case "Remove":
      return `${t} ${getEmoji("TREASURER_REMOVE")} Remove <@${
        tx.target
      }> from the vault\n`
    case "Config threshold":
      return `${t} ${getEmoji(
        "ANIMATED_VAULT_KEY",
        true,
      )} Set the threshold to ${tx.threshold}% for vault\n`
    case "Sent":
    case "Transfer": {
      const profileId = tx.target
      let to = `\`${shortenHashOrAddress(profileId)}\``
      if (!profileId) {
        to = ""
      } else if (!isAddress(profileId).valid) {
        to = await CacheManager.get({
          pool: "vault-recent-txns",
          key: profileId,
          call: async () => await getDiscordRenderableByProfileId(profileId),
        })
      }

      return `${t} ${tokenEmoji} -${amount} ${token}${to ? ` to ${to}` : ""}\n`
    }
    case "Swap": {
      const fromToken = tx.from_token.toUpperCase()
      const fromTokenEmoji = getEmojiToken(fromToken)
      const toToken = tx.to_token.toUpperCase()
      const toTokenEmoji = getEmojiToken(toToken)
      const emojiSwap = getEmoji("SWAP_ROUTE")
      return `${t} ${fromTokenEmoji} -${tx.amount_in} ${fromToken} ${emojiSwap} ${toTokenEmoji} +${tx.amount_out} ${toToken}\n`
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
  return [
    {
      name: `Recent Transactions`,
      value: formatted.join(""),
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
