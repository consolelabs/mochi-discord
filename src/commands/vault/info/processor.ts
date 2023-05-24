import config from "adapters/config"
import { GuildIdNotFoundError, InternalError, OriginalMessage } from "errors"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  EmojiKey,
  getEmoji,
  getEmojiToken,
  msgColors,
  shortenHashOrAddress,
  TokenEmojiKey,
} from "utils/common"
import { HOMEPAGE_URL } from "utils/constants"

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

  const balanceFields = buildBalanceFields(data)
  const myNftTitleFields = buildMyNftTitleFields(data)
  const myNftFields = buildMyNftFields(data)
  const treasurerFields = buildTreasurerFields(data)
  const recentTxFields = buildRecentTxFields(data)

  // build est total fields
  const estimatedTotalFields =
    data.estimated_total !== ""
      ? [
          {
            name: "Estimated total (U.S dollar)",
            value: `${getEmoji("CASH")} \`$${data.estimated_total}\``,
            inline: false,
          },
        ]
      : []

  fields = balanceFields
    .concat(myNftTitleFields)
    .concat(myNftFields)
    .concat(estimatedTotalFields)
    .concat(treasurerFields)
    .concat(recentTxFields)

  const embed = composeEmbedMessage(null, {
    color: msgColors.BLUE,
    title: `${getEmoji("ANIMATED_VAULT", true)} ${vaultName} vault`,
    description: `${walletAddress}${currentRequest}`,
  }).addFields(fields)

  return { messageOptions: { embeds: [embed], components: [] } }
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
  const address =
    tx.to_address === "" ? "Mochi Wallet" : shortenHashOrAddress(tx.to_address)
  switch (tx.action) {
    case "Sent":
      return `${t} ${getEmoji("SHARE")} Sent to ${shortenHashOrAddress(
        tx.target
      )} ${tx.amount} ${tx.token}\n`
    case "Received":
      return `${t} ${getEmoji("ANIMATED_MONEY", true)} Received \`${
        tx.amount
      } ${tx.token}\` ${getEmojiToken(tx.token)}\n`
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
      return `${t} ${getEmoji("SHARE")} Sent to ${address} ${tx.amount} ${
        tx.token
      }\n`
  }
}

function buildBalanceFields(data: any): any {
  // build balance fields
  const balanceFields = []
  const resBalance = data.balance.map((balance: any) => {
    return {
      name: `${balance.token_name}`,
      value: `${getEmojiToken(`${balance.token as TokenEmojiKey}`)}${
        balance.amount
      } ${balance.token}\n\`$${balance.amount_in_usd}\``,
      inline: true,
    }
  })

  for (let i = 0; i < resBalance.length; i++) {
    if (i !== 0 && i % 2 == 0) {
      balanceFields.push({
        name: "\u200b",
        value: "\u200b",
        inline: true,
      })
    }
    balanceFields.push(resBalance[i])
  }

  return balanceFields
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
    valueTreasurer += `${getEmoji(`NUM_${i + 1}` as EmojiKey)} <@${
      data.treasurer[i].user_discord_id
    }>\n`
  }
  return [
    {
      name: `Treasurer (${data.treasurer.length})`,
      value: valueTreasurer === "" ? "\u200b" : valueTreasurer,
      inline: false,
    },
  ]
}
