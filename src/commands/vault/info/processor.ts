import config from "adapters/config"
import { CommandInteraction, GuildMember } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { GetDateComponents } from "utils/time"
import {
  EmojiKey,
  getEmoji,
  getEmojiToken,
  hasAdministrator,
  msgColors,
  shortenHashOrAddress,
  TokenEmojiKey,
} from "utils/common"

export async function runGetVaultInfo({
  i,
  guildId,
}: {
  i: CommandInteraction
  guildId?: string | null
}) {
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }

  const {
    data: dataConfigChannel,
    ok: okConfigChannel,
    curl: curlConfigChannel,
    error: errorConfigChannel,
    log: logConfigChannel,
  } = await config.getVaultConfigThreshold(guildId)
  if (!okConfigChannel) {
    throw new APIError({
      curl: curlConfigChannel,
      error: errorConfigChannel,
      description: logConfigChannel,
    })
  }

  const {
    data: dataInfo,
    ok: okInfo,
    curl: curlInfo,
    error: errorInfo,
    log: logInfo,
  } = await config.getVaultInfo()
  if (!okInfo) {
    throw new APIError({
      curl: curlInfo,
      error: errorInfo,
      description: logInfo,
    })
  }

  const member = i.member as GuildMember
  const step =
    hasAdministrator(member) === true ? dataInfo.mod_step : dataInfo.normal_step

  const title =
    hasAdministrator(member) === true ? "What can this bot do?" : "Vault Info"

  const logChannel =
    dataConfigChannel == null
      ? "Not set"
      : dataConfigChannel.channel_id == null
      ? "Not set"
      : `<#${dataConfigChannel.channel_id}>`

  const description = `${dataInfo.description}\n\n\`logchannel:\`${logChannel}\n\n${step}\n [Read instruction](${dataInfo.instruction_link}) for a complete guide`
  const embed = new MessageEmbed()
    .setTitle(`${getEmoji("INFO_VAULT")} ${title}`)
    .setDescription(description)
    .setColor(msgColors.MOCHI)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1090195482506174474/1090906036464005240/image.png"
    )

  return { messageOptions: { embeds: [embed] } }
}

export async function runGetVaultDetail({
  i,
  guildId,
}: {
  i: CommandInteraction
  guildId?: string | null
}) {
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }
  const vaultName = i.options.getString("name", false) ?? ""
  const { data, ok, curl, error, log } = await config.getVaultDetail(
    vaultName,
    guildId
  )
  if (!ok) {
    throw new APIError({
      curl,
      error,
      description: log,
    })
  }

  const walletAddress =
    data.wallet_address !== ""
      ? `**Wallet Address**\n\`\`\`${data.wallet_address}\`\`\``
      : ""

  let description = `
  ${walletAddress}
  **Current Transaction**
  `
  data.current_request.forEach((request: any) => {
    description += formatCurrentRequest(request)
  })

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
    color: msgColors.MOCHI,
    title: `${getEmoji("ANIMATED_VAULT", true)} ${vaultName} vault`,
    description: description,
  }).addFields(fields)

  return { messageOptions: { embeds: [embed] } }
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
      }]](https://google.com) Sent to ${shortenHashOrAddress(
        request.target
      )} ${getEmojiToken(`${request.token as TokenEmojiKey}`)} ${
        request.amount
      } ${request.token}\n`
    case "Add":
      return `${getEmoji("CHECK")} [[${request.total_approved_submission}/${
        request.total_submission
      }]](https://google.com) Add <@${request.target}> as vault treasurer\n`
    case "Remove":
      return `${getEmoji("CHECK")} [[${request.total_approved_submission}/${
        request.total_submission
      }]](https://google.com) Remove <@${request.target}> from the vault\n`
    case "Transfer":
      return `${getEmoji("CHECK")} [[${request.total_approved_submission}/${
        request.total_submission
      }]](https://google.com) Sent to ${address} ${
        request.amount
      } ${request.token.toUpperCase()}\n`
  }
}

function formatRecentTransaction(tx: any) {
  const date = new Date(tx.date)
  const { monthName, hour, minute, time, day } = GetDateComponents(date)
  const t = `${monthName} ${day} ${hour}:${minute} ${time.toLowerCase()}`
  const address =
    tx.to_address === "" ? "Mochi Wallet" : shortenHashOrAddress(tx.to_address)
  switch (tx.action) {
    case "Sent":
      return `[[${t}]](https://mochi.gg/) ${getEmoji(
        "SHARE"
      )} Sent to ${shortenHashOrAddress(tx.target)} ${tx.amount} ${tx.token}\n`
    case "Received":
      return `[[${t}]](https://mochi.gg/) ${getEmoji(
        "ANIMATED_MONEY",
        true
      )} Received from ${shortenHashOrAddress(tx.target)} ${tx.amount} ${
        tx.token
      }\n`
    case "Add":
      return `[[${t}]](https://mochi.gg/) ${getEmoji("TREASURER_ADD")} Add <@${
        tx.target
      }> as vault treasurer\n`
    case "Remove":
      return `[[${t}]](https://mochi.gg/) ${getEmoji(
        "TREASURER_REMOVE"
      )} Remove <@${tx.target}> from the vault\n`
    case "Config threshold":
      return `[[${t}]](https://mochi.gg/) ${getEmoji(
        "ANIMATED_VAULT_KEY",
        true
      )} Set the threshold to ${tx.threshold}% for vault\n`
    case "Transfer":
      return `[[${t}]](https://mochi.gg/) ${getEmoji(
        "SHARE"
      )} Sent to ${address} ${tx.amount} ${tx.token}\n`
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

function buildRecentTxFields(data: any): any {
  let valueRecentTx = ""
  for (let i = 0; i < data.recent_transaction.length; i++) {
    valueRecentTx += formatRecentTransaction(data.recent_transaction[i])
  }
  return [
    {
      name: `Recent Transaction`,
      value: valueRecentTx === "" ? "\u200b" : valueRecentTx,
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
