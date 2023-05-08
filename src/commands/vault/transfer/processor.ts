import config from "adapters/config"
import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  ButtonInteraction,
  Message,
} from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { getEmoji, msgColors, shortenHashOrAddress } from "utils/common"
import NodeCache from "node-cache"
import {
  getErrorEmbed,
  composeEmbedMessage,
  getSuccessEmbed,
} from "ui/discord/embed"

export const treasurerTransferCache = new NodeCache({
  stdTTL: 0,
  checkperiod: 1,
  useClones: false,
})

export async function runTransferTreasurer({
  i,
  guildId,
}: {
  i: CommandInteraction
  guildId?: string | null
}) {
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }

  const vaultName = i.options.getString("name") ?? ""
  const token = i.options.getString("token") ?? ""
  const address = i.options.getString("address") ?? ""
  const shortenAddress = shortenHashOrAddress(address)
  const amount = i.options.getString("amount") ?? ""
  const chain = i.options.getString("chain") ?? ""
  const {
    data: dataTransferTreasurerReq,
    status: statusTransferTreasurerReq,
    curl: curlTransferTreasurerReq,
    log: logTransferTreasurerReq,
    originalError: originalErrorTransferTreasurerReq,
  } = await config.createTreasureRequest({
    guild_id: guildId,
    vault_name: vaultName,
    message: i.options.getString("message") ?? "",
    type: "transfer",
    requester: i.user.id,
    address: address,
    chain: chain,
    token: token,
    amount: amount,
  })

  if (
    statusTransferTreasurerReq !== 200 &&
    statusTransferTreasurerReq !== 400
  ) {
    throw new APIError({
      curl: curlTransferTreasurerReq,
      description: logTransferTreasurerReq,
    })
  }

  if (statusTransferTreasurerReq === 400 && originalErrorTransferTreasurerReq) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: originalErrorTransferTreasurerReq,
          }),
        ],
      },
    }
  }

  // send DM to submitter
  dataTransferTreasurerReq?.treasurer.forEach((treasurer: any) => {
    const actionRow = new MessageActionRow().addComponents(
      new MessageButton({
        customId: `treaTransfer-approved-${dataTransferTreasurerReq?.request.id}-${dataTransferTreasurerReq?.request.vault_id}-${treasurer.user_discord_id}-${shortenAddress}-${amount}-${token}-${chain}-${i.channelId}`,
        style: "SUCCESS",
        label: "Approve",
      }),
      new MessageButton({
        customId: `treaTransfer-rejected-${dataTransferTreasurerReq?.request.id}-${dataTransferTreasurerReq?.request.vault_id}-${treasurer.user_discord_id}-${shortenAddress}-${amount}-${token}-${chain}-${i.channelId}`,
        style: "DANGER",
        label: "Reject",
      })
    )

    const cacheKey = `treaTransfer-${dataTransferTreasurerReq?.request.id}-${dataTransferTreasurerReq?.request.vault_id}-${treasurer.user_discord_id}-${shortenAddress}-${amount}-${token}-${chain}-${i.channelId}`

    i.guild?.members
      .fetch(treasurer.user_discord_id)
      .then(async (treasurer) => {
        const msg = await treasurer.send({
          embeds: [
            composeEmbedMessage(null, {
              title: `${getEmoji("ANIMATED_BELL", true)} Mochi notifications`,
              description: `**Approval Request #${
                dataTransferTreasurerReq?.request.id
              }**\n<@${i.user.id}> has submitted a request\n${getEmoji(
                "SHARE"
              )} Send ${getEmoji(
                "ETH"
              )} ${amount} ${token} from ${vaultName} to \`${shortenAddress}\` \nMessage ${getEmoji(
                "ANIMATED_CHAT",
                true
              )}\n \`\`\`${dataTransferTreasurerReq?.request.message}\`\`\``,
              color: msgColors.MOCHI,
              thumbnail:
                "https://cdn.discordapp.com/attachments/1090195482506174474/1092703907911847976/image.png",
            }),
          ],
          components: [actionRow],
        })

        treasurerTransferCache.set(cacheKey, msg)
      })
  })

  // send DM to treasurer in vault

  const embed = new MessageEmbed()
    .setTitle(
      `${getEmoji("PROPOSAL")} Request #${
        dataTransferTreasurerReq?.request.id
      } successfully created`
    )
    .setDescription(
      `You want to send ${amount} ${token} to \`${shortenAddress}\` \n\nMessage ${getEmoji(
        "ANIMATED_CHAT",
        true
      )}\n\`\`\`${
        dataTransferTreasurerReq?.request.message
      }\`\`\`\nWe'll notify you once all treasurers have accepted the request.`
    )
    .setColor(msgColors.MOCHI)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1090195482506174474/1092703907911847976/image.png"
    )

  return { messageOptions: { embeds: [embed] } }
}

export async function handleTreasurerTransfer(i: ButtonInteraction) {
  await i.deferUpdate()
  const args = i.customId.split("-")
  const choice = args[1]
  const requestId = args[2]
  const vaultId = args[3]
  const submitter = args[4]
  const address = args[5]
  const amount = args[6]
  const token = args[7]
  const chain = args[8]
  const channelId = args[9]

  const {
    data: dataTransferTreasurer,
    status,
    curl,
    log,
    originalError,
  } = await config.createTreasurerSubmissions({
    vault_id: Number(vaultId),
    request_id: Number(requestId),
    submitter: submitter,
    choice: choice,
    type: "transfer",
  })

  if ((status !== 200 && status !== 400) || !dataTransferTreasurer) {
    throw new APIError({
      curl: curl,
      description: log,
    })
  }

  if (status === 400 && originalError) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: originalError,
          }),
        ],
      },
    }
  }

  const modelNotify = {
    guild_id: dataTransferTreasurer.submission.guild_id,
    vault_id: Number(vaultId),
    channel_id: channelId,
    type: "transfer",
    status: "",
    token: token,
    amount: amount,
    address: address,
    chain: chain,
  }
  if (dataTransferTreasurer.vote_result.is_approved === true) {
    // add treasurer to vault
    const { data, status, curl, log } = await config.transferVaultToken({
      guild_id: dataTransferTreasurer.submission.guild_id,
      address: address,
      vault_id: Number(vaultId),
      amount: amount,
      token: token,
      chain: chain,
    })
    if ((status !== 200 && status !== 400) || !data) {
      throw new APIError({
        curl: curl,
        description: log,
      })
    }

    modelNotify.status = "success"
    // send notify
    await config.createTreasurerResult(modelNotify)

    await i.editReply({
      embeds: [
        getSuccessEmbed({
          title: "Successfully voted",
          description: `You have updated your vote successfully. Thank you for your vote ${getEmoji(
            "ANIMATED_HEART"
          )}`,
        }),
      ],
      components: [],
    })

    // get all key in cache
    Array.from(treasurerTransferCache.keys())
      .filter((key) => key.includes(`treaTransfer-${requestId}-${vaultId}`))
      .forEach(async (key) => {
        const msg = treasurerTransferCache.get(key) as Message
        if (msg) {
          await msg.edit({
            embeds: [
              getSuccessEmbed({
                title: `Approved ${requestId}!!!`,
                description: `Request has already been approved by majority treasurers \`${dataTransferTreasurer.vote_result.total_approved_submission}/${dataTransferTreasurer.vote_result.total_submission}\``,
              }),
            ],
            components: [],
          })
        }
        treasurerTransferCache.del(key)
      })
  } else {
    if (
      dataTransferTreasurer.vote_result.total_rejected_submisison >
      dataTransferTreasurer.vote_result.allowed_rejected_submisison
    ) {
      modelNotify.status = "fail"
      // send notify
      await config.createTreasurerResult(modelNotify)

      // get all key in cache
      Array.from(treasurerTransferCache.keys())
        .filter((key) => key.includes(`treaTransfer-${requestId}-${vaultId}`))
        .forEach(async (key) => {
          const msg = treasurerTransferCache.get(key) as Message
          if (msg) {
            await msg.edit({
              embeds: [
                getErrorEmbed({
                  title: `Rejected ${requestId}!!!`,
                  description: `Request has already been rejected by majority treasurers \`${dataTransferTreasurer.vote_result.total_rejected_submisison}/${dataTransferTreasurer.vote_result.total_submission}\``,
                }),
              ],
              components: [],
            })
          }
          treasurerTransferCache.del(key)
        })
    }
  }
}
