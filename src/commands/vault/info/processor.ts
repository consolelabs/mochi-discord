import config from "adapters/config"
import { CommandInteraction, GuildMember } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { GetDateComponents } from "utils/time"
import {
  getEmoji,
  hasAdministrator,
  msgColors,
  shortenHashOrAddress,
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

  let description = `
  **Wallet Address**\n\`\`\`${data.wallet_address}\`\`\`
  **Current Request**\n
  `
  data.current_request.forEach((request: any) => {
    description += formatCurrentRequest(request)
  })

  let fields = []

  // build balance fields
  const balanceFields = []
  const resBalance = data.balance.map((balance: any) => {
    return {
      name: `${balance.token_name}`,
      value: `${getEmoji(`${balance.token}`)}${balance.amount} ${
        balance.token
      }\n\`$${balance.amount_in_usd}\``,
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
  balanceFields.push({
    name: "\u200b",
    value: "\u200b",
    inline: true,
  })

  let totalNft = 0
  for (let i = 0; i < data.my_nft.length; i++) {
    totalNft += data.my_nft[i].total
  }
  const myNftTitleFields = [
    {
      name: `My NFT (${totalNft})`,
      value: "\u200b",
      inline: false,
    },
  ]

  // build my_nft fields
  const resMyNft = data.my_nft.map((nft: any) => {
    let nftElements = ""
    for (let i = 0; i < nft.nft.length; i++) {
      nftElements += `${nft.nft[i].name} #${nft.nft[i].id}\n`
    }
    return {
      name: `${getEmoji(`VAULT_NFT`)} ${nft.collection_name} (${nft.chain}) ${
        nft.total
      }`,
      value: `${nftElements}`,
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
  myNftFields.push({
    name: "\u200b",
    value: "\u200b",
    inline: true,
  })

  // build est total fields
  const estimatedTotalFields = [
    {
      name: "Estimated total (U.S dollar)",
      value: `${getEmoji("CASH")} \`$${data.estimated_total}\``,
      inline: false,
    },
  ]

  // build treasurer fields
  let valueTreasurer = ""
  for (let i = 0; i < data.treasurer.length; i++) {
    valueTreasurer += `${getEmoji(`NUM_${i + 1}`)} <@${
      data.treasurer[i].user_discord_id
    }>\n`
  }
  const treasurerFields = [
    {
      name: `Treasurer (${data.treasurer.length})`,
      value: valueTreasurer,
      inline: false,
    },
  ]

  // build recent transaction fields
  let valueRecentTx = ""
  for (let i = 0; i < data.recent_transaction.length; i++) {
    valueRecentTx += formatRecentTransaction(data.recent_transaction[i])
  }
  const recentTxFields = [
    {
      name: `Recent Transaction`,
      value: valueRecentTx,
      inline: false,
    },
  ]

  fields = balanceFields
    .concat(myNftTitleFields)
    .concat(myNftFields)
    .concat(estimatedTotalFields)
    .concat(treasurerFields)
    .concat(recentTxFields)

  const embed = composeEmbedMessage(null, {
    color: msgColors.MOCHI,
    title: `${getEmoji("VAULT")} ${vaultName} vault`,
    description: description,
  }).addFields(fields)

  return { messageOptions: { embeds: [embed] } }
}

function formatCurrentRequest(request: any) {
  switch (request.action) {
    case "Sent":
      return `${getEmoji("APPROVE_VAULT")} [[${
        request.total_approved_submission
      }/${
        request.total_submission
      }]](https://google.com) Sent to ${shortenHashOrAddress(
        request.target
      )} ${getEmoji(`${request.token}`)} ${request.amount} ${request.token}\n`
    case "Add":
      return `${getEmoji("APPROVE_VAULT")} [[${
        request.total_approved_submission
      }/${
        request.total_submission
      }]](https://google.com) Add ${shortenHashOrAddress(
        request.target
      )} to the vault\n`
    case "Remove":
      return `${getEmoji("APPROVE_VAULT")} [[${
        request.total_approved_submission
      }/${
        request.total_submission
      }]](https://google.com) Remove ${shortenHashOrAddress(
        request.target
      )} from the vault\n`
  }
}

function formatRecentTransaction(tx: any) {
  const date = new Date(tx.date)
  const { monthName, hour, minute, time, day } = GetDateComponents(date)
  const t = `${monthName} ${day} ${hour}:${minute} ${time.toLowerCase()}`
  switch (tx.action) {
    case "Sent":
      return `[[${t}]](https://mochi.gg/) ${getEmoji(
        "SHARE"
      )} Sent to ${shortenHashOrAddress(tx.target)} ${tx.amount} ${tx.token}\n`
    case "Received":
      return `[[${t}]](https://mochi.gg/) ${getEmoji(
        "ACTIVITY_MONEY"
      )} Received from ${shortenHashOrAddress(tx.target)} ${tx.amount} ${
        tx.token
      }\n`
  }
}
