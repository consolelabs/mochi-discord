import config from "adapters/config"
import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  ButtonInteraction,
  Message,
} from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { MessageEmbed } from "discord.js"
import { getEmoji, getAnimatedEmojiURL, emojis, msgColors } from "utils/common"
import NodeCache from "node-cache"
import {
  getErrorEmbed,
  composeEmbedMessage,
  getSuccessEmbed,
} from "ui/discord/embed"
import { wrapError } from "utils/wrap-error"

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

  const user = i.options.getUser("user")
  if (!user) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "Invalid user. Please choose another one!",
          }),
        ],
      },
    }
  }

  const vaultName = i.options.getString("name", true)
  const token = i.options.getString("token", true)
  const address = i.options.getString("address", false) ?? ""
  const amount = i.options.getString("amount", true)
  const chain = i.options.getString("chain", true)
  const {
    data: dataTransferTreasurerReq,
    status: statusTransferTreasurerReq,
    originalError: originalErrorTransferTreasurerReq,
  } = await config.createTreasureRequest({
    guild_id: guildId,
    vault_name: vaultName,
    message: i.options.getString("message", false) ?? "",
    type: "transfer",
    requester: user.id,
    user_discord_id: user.id,
    address: address,
    chain: chain,
    token: token,
    amount: amount,
  })

  if (statusTransferTreasurerReq === 400 && originalErrorTransferTreasurerReq) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Create transfer request failed",
      description: originalErrorTransferTreasurerReq,
    })
  }

  const msgField =
    dataTransferTreasurerReq?.request.message === ""
      ? ``
      : `\n\nMessage ${getEmoji("ANIMATED_CHAT", true)}\n\`\`\`${
          dataTransferTreasurerReq?.request.message
        }\`\`\``
  // send DM to submitter
  dataTransferTreasurerReq?.treasurer.forEach((treasurer: any) => {
    const actionRow = new MessageActionRow().addComponents(
      new MessageButton({
        customId: `treaTransfer-approved-${dataTransferTreasurerReq?.request.id}-${dataTransferTreasurerReq?.request.vault_id}-${treasurer.user_discord_id}-${address}-${amount}-${token}-${chain}-${i.channelId}-${user.id}`,
        style: "SUCCESS",
        label: "Approve",
      }),
      new MessageButton({
        customId: `treaTransfer-rejected-${dataTransferTreasurerReq?.request.id}-${dataTransferTreasurerReq?.request.vault_id}-${treasurer.user_discord_id}-${address}-${amount}-${token}-${chain}-${i.channelId}-${user.id}`,
        style: "DANGER",
        label: "Reject",
      })
    )

    const cacheKey = `treaTransfer-${dataTransferTreasurerReq?.request.id}-${dataTransferTreasurerReq?.request.vault_id}-${treasurer.user_discord_id}-${address}-${amount}-${token}-${chain}-${i.channelId}`

    i.guild?.members.fetch(treasurer.user_discord_id).then((treasurer) => {
      wrapError(i, async () => {
        const msg = await treasurer.send({
          embeds: [
            composeEmbedMessage(null, {
              title: `${getEmoji("ANIMATED_BELL", true)} mochi notifications`,
              description: `<@${
                i.user.id
              }> has submitted the approval request #${
                dataTransferTreasurerReq?.request.id
              }\n${getEmoji("SHARE")} Send ${getEmoji(
                token.toUpperCase() as keyof typeof emojis
              )} ${amount} ${token} from ${vaultName} to <@${
                user.id
              }> ${msgField}`,
              color: msgColors.BLUE,
              thumbnail: getAnimatedEmojiURL(emojis.ANIMATED_OPEN_VAULT),
            }),
          ],
          components: [actionRow],
        })

        treasurerTransferCache.set(cacheKey, msg)
      })
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
      `You want to send ${amount} ${token} to <@${user.id}> \n${msgField}We'll notify you once all treasurers have accepted the request.`
    )
    .setColor(msgColors.BLUE)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())
    .setThumbnail(getAnimatedEmojiURL(emojis.ANIMATED_OPEN_VAULT))

  return { messageOptions: { embeds: [embed] } }
}

export async function handleTreasurerTransfer(i: ButtonInteraction) {
  if (!i.deferred) {
    await i.deferUpdate().catch(() => null)
  }

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
  const toUser = args[10]

  const {
    data: dataTransferTreasurer,
    status,
    originalError,
  } = await config.createTreasurerSubmissions({
    vault_id: Number(vaultId),
    request_id: Number(requestId),
    submitter: submitter,
    choice: choice,
    type: "transfer",
  })

  if (status === 400 && originalError) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Submit vote failed",
      description: originalError,
    })
  }

  const modelNotify = {
    guild_id: dataTransferTreasurer?.submission.guild_id,
    vault_id: Number(vaultId),
    channel_id: channelId,
    type: "transfer",
    status: "",
    user_discord_id: toUser,
    token,
    amount,
    address,
    chain,
  }
  if (dataTransferTreasurer?.vote_result.is_approved) {
    // add treasurer to vault
    await config.transferVaultToken({
      guild_id: dataTransferTreasurer.submission.guild_id,
      vault_id: Number(vaultId),
      request_id: Number(requestId),
      address,
      amount,
      token,
      chain,
    })

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
      .forEach((key) => {
        wrapError(i, async () => {
          const msg = treasurerTransferCache.get(key) as Message
          if (msg) {
            await msg.edit({
              embeds: [
                getSuccessEmbed({
                  title: `The request ${requestId} has been approved`,
                  description: `Request has already been approved by majority of treasurers \`${dataTransferTreasurer.vote_result.total_approved_submission}/${dataTransferTreasurer.vote_result.total_submission}\``,
                }),
              ],
              components: [],
            })
          }
          treasurerTransferCache.del(key)
        })
      })
  } else {
    if (
      dataTransferTreasurer?.vote_result.total_rejected_submisison >
      dataTransferTreasurer?.vote_result.allowed_rejected_submisison
    ) {
      modelNotify.status = "fail"
      // send notify
      await config.createTreasurerResult(modelNotify)

      // get all key in cache
      Array.from(treasurerTransferCache.keys())
        .filter((key) => key.includes(`treaTransfer-${requestId}-${vaultId}`))
        .forEach((key) => {
          wrapError(i, async () => {
            const msg = treasurerTransferCache.get(key) as Message
            if (msg) {
              await msg.edit({
                embeds: [
                  getErrorEmbed({
                    title: `The request ${requestId} has been rejected`,
                    description: `Request has already been rejected by majority of treasurers \`${dataTransferTreasurer?.vote_result.total_rejected_submisison}/${dataTransferTreasurer?.vote_result.total_submission}\``,
                  }),
                ],
                components: [],
              })
            }
            treasurerTransferCache.del(key)
          })
        })
    }
  }
}
