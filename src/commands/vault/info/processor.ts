import config from "adapters/config"
import CacheManager from "cache/node-cache"
import { formatView, getButtons } from "commands/balances/index/processor"
import { MessageActionRow, MessageButton } from "discord.js"
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
import { getDiscordRenderableByProfileId } from "utils/profile"

export async function runGetVaultDetail(
  vaultName: string,
  interaction: OriginalMessage,
) {
  const {
    data,
    ok,
    curl,
    error,
    originalError,
    log,
    status = 500,
  } = await config.getVaultDetail(vaultName, interaction.guildId || "")
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
    `${getEmoji("ANIMATED_VAULT", true)}\`Name. ${vaultName}\``,
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

function buildTreasurerFields(data: any): any {
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
