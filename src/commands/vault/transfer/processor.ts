import config from "adapters/config"
import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  ButtonInteraction,
  Message,
} from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import {
  getEmoji,
  getEmojiToken,
  TokenEmojiKey,
  getAnimatedEmojiURL,
  emojis,
  msgColors,
  shortenHashOrAddress,
} from "utils/common"
import { listSubmissionVault, createActionLine } from "utils/vault"
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

  const address = i.options.getString("address", false) ?? ""
  const user = i.options.getUser("user")
  if (!user && address === "") {
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
  const shortenAddress = address === "" ? "" : shortenHashOrAddress(address)
  const amount = i.options.getString("amount", true)
  const chain = i.options.getString("chain", true)
  const userId = user?.id ?? ""
  const {
    data: dataTransferTreasurerReq,
    status: statusTransferTreasurerReq,
    originalError: originalErrorTransferTreasurerReq,
  } = await config.createTreasureRequest({
    guild_id: guildId,
    vault_name: vaultName,
    message:
      i.options.getString("message")?.trim() || "Send money to treasurer",
    type: "transfer",
    requester: i.user.id,
    user_discord_id: userId,
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

  const msgField = `\nMessage ${getEmoji("ANIMATED_CHAT", true)}\n\`\`\`${
    dataTransferTreasurerReq?.request.message
  }\`\`\`\n`
  const destination =
    shortenAddress !== "" ? `\`${shortenAddress}\`` : `<@${user?.id}>`
  // send DM to submitter
  // send DM to list treasurer but not requester, requester default approve
  if (!dataTransferTreasurerReq?.is_decided_and_executed) {
    dataTransferTreasurerReq?.treasurer.forEach((treasurer: any) => {
      if (treasurer.user_discord_id === i.user.id) {
        return
      }
      const actionRow = new MessageActionRow().addComponents(
        new MessageButton({
          customId: `treaTransfer-approved-${dataTransferTreasurerReq?.request.id}-${dataTransferTreasurerReq?.request.vault_id}-${treasurer.user_discord_id}-${amount}-${token}-${chain}-${i.channelId}-${userId}`,
          style: "SUCCESS",
          label: "Approve",
        }),
        new MessageButton({
          customId: `treaTransfer-rejected-${dataTransferTreasurerReq?.request.id}-${dataTransferTreasurerReq?.request.vault_id}-${treasurer.user_discord_id}-${amount}-${token}-${chain}-${i.channelId}-${userId}`,
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
                title: `${getEmoji("ANIMATED_BELL", true)} Mochi Notifications`,
                description: `<@${
                  i.user.id
                }> has submitted the request in ${vaultName} vault \n${getEmoji(
                  "SHARE"
                )} Send ${getEmojiToken(
                  token.toUpperCase() as TokenEmojiKey
                )} ${amount} ${token} from ${vaultName} to ${destination} ${msgField}`,
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
  }

  // send DM to treasurer in vault
  const transferTarget = user?.username ?? shortenAddress
  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("PROPOSAL")} Request to ${createActionLine({
      action: "transfer",
      vault: vaultName,
      amount,
      token,
      transferTarget,
    })} has been successfully created`,
    description: `You want to send ${getEmoji(
      token.toUpperCase() as keyof typeof emojis
    )} ${amount} ${token.toUpperCase()} to ${destination} \n${msgField}We'll notify you once all treasurers have accepted the request.`,
    color: msgColors.BLUE,
    thumbnail: getAnimatedEmojiURL(emojis.ANIMATED_OPEN_VAULT),
  })

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
  const amount = args[5]
  const token = args[6]
  const chain = args[7]
  // const channelId = args[8]
  const toUser = args[9]

  const {
    data: dataTreasurerReq,
    status: statusTreasurerReq,
    originalError: originalErrorTreasurerReq,
  } = await config.getTreasurerRequest(requestId)
  if (statusTreasurerReq === 400 && originalErrorTreasurerReq) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Submit vote failed",
      description: originalErrorTreasurerReq,
    })
  }

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

  if (dataTransferTreasurer?.vote_result.is_approved) {
    // add treasurer to vault
    await config.transferVaultToken({
      guild_id: dataTransferTreasurer.submission.guild_id,
      vault_id: Number(vaultId),
      request_id: Number(requestId),
      address: dataTreasurerReq?.address,
      amount,
      token,
      chain,
      target: toUser ? toUser : "",
    })

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
                  title: `The request to ${createActionLine({
                    action: "transfer",
                    vault: dataTransferTreasurer.submission.vault.name,
                  })} has been approved`,
                  description: `Request has already been approved by majority of treasurers \`${
                    dataTransferTreasurer.vote_result.total_approved_submission
                  }/${
                    dataTransferTreasurer.vote_result.total_submission
                  }\`\n${listSubmissionVault(
                    dataTransferTreasurer.total_submissions
                  )}`,
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
                    title: `The request to ${createActionLine({
                      action: "transfer",
                      vault: dataTransferTreasurer?.submission.vault.name,
                    })} has been rejected`,
                    description: `Request has already been rejected by majority of treasurers \`${
                      dataTransferTreasurer?.vote_result
                        .total_rejected_submisison
                    }/${
                      dataTransferTreasurer?.vote_result.total_submission
                    }\`\n${listSubmissionVault(
                      dataTransferTreasurer?.total_submissions
                    )}`,
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
