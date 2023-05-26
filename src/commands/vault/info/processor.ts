import config from "adapters/config"
import { formatView, getButtons } from "commands/balances/index/processor"
import { MessageActionRow, MessageButton } from "discord.js"
import { GuildIdNotFoundError, InternalError, OriginalMessage } from "errors"
import { APIError } from "errors"
import { composeEmbedMessage2 } from "ui/discord/embed"
import {
  EmojiKey,
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  msgColors,
  shortenHashOrAddress,
  TokenEmojiKey,
} from "utils/common"
import { HOMEPAGE_URL } from "utils/constants"
import { formatDigit } from "utils/defi"

export async function runGetVaultDetail(
  vaultName: string,
  interaction: OriginalMessage
) {
  if (!interaction.guildId) {
    throw new GuildIdNotFoundError({ message: interaction })
  }
  const { data, ok, status, curl, error, originalError, log } =
    await config.getVaultDetail(vaultName, interaction.guildId)
  if (!ok) {
    if (status === 400 && originalError) {
      throw new InternalError({
        msgOrInteraction: interaction,
        title: "Command error",
        description: originalError,
      })
    }
    throw new APIError({ curl, error, description: log })
  }

  const walletAddress =
    data.wallet_address !== ""
      ? `**Wallet Address**\n\`\`\`EVM | ${data.wallet_address}\nSOL | ${data.solana_wallet_address}\`\`\``
      : ""

  const titleCurrentRequest = `**Current request**\n`
  let currentRequest = ""
  data.current_request.forEach((request: any) => {
    currentRequest += formatCurrentRequest(request)
  })
  currentRequest = currentRequest ? titleCurrentRequest + currentRequest : ""

  let fields = []

  const { totalWorth, text: tokenBalanceBreakdownText } = formatView(
    "compact",
    data.balance
  )
  const myNftTitleFields = buildMyNftTitleFields(data)
  const myNftFields = buildMyNftFields(data)
  const treasurerFields = buildTreasurerFields(data)
  const recentTxFields = buildRecentTxFields(data)

  fields = [
    {
      name: "Tokens",
      value: tokenBalanceBreakdownText + "\u200b",
      inline: false,
    },
  ]
    .concat(myNftTitleFields)
    .concat(myNftFields)
    .concat(treasurerFields)
    .concat(recentTxFields)

  const creator = data.treasurer.find((t: any) => t.role === "creator") ?? ""
  const basicInfo = [
    `${getEmoji("ANIMATED_VAULT", true)}\`Name. ${vaultName}\``,
    `${getEmoji("CHECK")}\`Approve threshold. ${data.threshold ?? 0}%\``,
    `${getEmoji("ANIMATED_VAULT_KEY", true)}\`Creator. \`<@${
      creator.user_discord_id
    }>`,
    `${getEmoji("CASH")}\`Total Balance. $${formatDigit({
      value: String(totalWorth) || "0",
      fractionDigits: 2,
    })}\``,
  ].join("\n")
  const embed = composeEmbedMessage2(interaction as any, {
    color: msgColors.BLUE,
    author: ["Vault info", getEmojiURL(emojis.ANIMATED_DIAMOND)],
    description: `${basicInfo}\n\n${walletAddress}${currentRequest}`,
  }).addFields(fields)

  return {
    messageOptions: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          ...getButtons("vault_info"),
          new MessageButton()
            .setStyle("SECONDARY")
            .setEmoji(getEmoji("CONFIG"))
            .setCustomId("vault_info_setting")
            .setLabel("Setting")
        ),
      ],
    },
  }
}

function formatCurrentRequest(request: any) {
  const address =
    request.address === ""
      ? "Mochi Wallet"
      : shortenHashOrAddress(request.address)
  switch (request.action) {
    case "Sent":
      return `${getEmoji("CHECK")} [[${request.total_approved_submission}/${
        request.total_submission
      }]](${HOMEPAGE_URL}) Sent to ${shortenHashOrAddress(
        request.target
      )} ${getEmojiToken(`${request.token as TokenEmojiKey}`)} ${
        request.amount
      } ${request.token}\n`
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
      }]](${HOMEPAGE_URL}) Sent to ${address} ${
        request.amount
      } ${request.token.toUpperCase()}\n`
  }
}

function formatRecentTransaction(tx: any) {
  const date = new Date(tx.date)
  const t = `<t:${Math.floor(date.getTime() / 1000)}:R>`
  const amount = ["+", "-"].includes(tx.amount.split("")[0])
    ? tx.amount.slice(1)
    : tx.amount
  const token = tx.token.length <= 5 ? tx.token : "token"
  const tokenEmoji = getEmojiToken(token)
  // const address =
  //   tx.to_address === "" ? "Mochi Wallet" : shortenHashOrAddress(tx.to_address)
  switch (tx.action) {
    case "Sent":
      return `${t} ${getEmoji(
        "SHARE"
      )} Sent \`${amount} ${token}\` ${tokenEmoji}\n`
    case "Received":
      return `${t} ${getEmoji(
        "ANIMATED_MONEY",
        true
      )} Received \`${amount} ${token}\` ${tokenEmoji}\n`
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
        true
      )} Set the threshold to ${tx.threshold}% for vault\n`
    case "Transfer":
      return `${t} ${getEmoji(
        "SHARE"
      )} Sent to \`${amount} ${token}\` ${tokenEmoji}\n`
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

export function buildRecentTxFields(data: any): any {
  let valueRecentTx = ""
  for (let i = 0; i < data.recent_transaction.length; i++) {
    valueRecentTx += formatRecentTransaction(data.recent_transaction[i])
  }
  if (!valueRecentTx) return []
  return [
    {
      name: `Recent Transaction`,
      value: valueRecentTx,
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
  return [
    {
      name: `Treasurer (${data.treasurer.length})`,
      value: valueTreasurer === "" ? "\u200b" : valueTreasurer,
      inline: false,
    },
  ]
}
