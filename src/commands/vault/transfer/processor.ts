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
  emojis,
  msgColors,
  shortenHashOrAddress,
  getEmojiURL,
} from "utils/common"
import {
  getErrorEmbed,
  composeEmbedMessage,
  getSuccessEmbed,
} from "ui/discord/embed"
import { wrapError } from "utils/wrap-error"
import { getProfileIdByDiscord } from "utils/profile"

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
    i.editReply({
      embeds: [
        getErrorEmbed({
          description: "Invalid user. Please choose another one!",
        }),
      ],
    })
    return
  }

  let userProfileId = ""
  if (user) {
    userProfileId = await getProfileIdByDiscord(user.id)
  }
  const requesterProfileId = await getProfileIdByDiscord(i.user.id)

  const vaultName = i.options.getString("name", true)
  const token = i.options.getString("token", true)
  const shortenAddress = address === "" ? "" : shortenHashOrAddress(address)
  const amount = i.options.getString("amount", true)
  const chain = i.options.getString("chain", true)
  const userId = userProfileId
  const {
    data: dataTransferTreasurerReq,
    ok,
    error,
    originalError,
  } = await config.createTreasureRequest({
    guild_id: guildId,
    vault_name: vaultName,
    message:
      i.options.getString("message")?.trim() || "Send money to treasurer",
    type: "transfer",
    requester_profile_id: requesterProfileId,
    user_profile_id: userProfileId,
    address: address,
    chain: chain,
    token: token,
    amount: amount,
    message_url: `https://discord.com/channels/${i.guildId}/${i.channelId}/${i.id}`,
  })

  if (!ok) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Vault error",
      descriptions: ["We couldn't process the request, please try again."],
      reason: error || originalError || "Something wrong with our system",
    })
  }

  const transferTarget = user ?? `\`${shortenAddress}\``
  const description = (isDm = false, messageLink?: string) =>
    [
      `${getEmoji("PROPOSAL")}\`Request ID.    \` ${
        dataTransferTreasurerReq?.request.id ?? ""
      }`,
      `${getEmoji("NEWS")}\`Requester.     \` ${i.user}`,
      `${getEmoji("NFT2")}\`Amount.        \` ${getEmojiToken(
        token.toUpperCase() as TokenEmojiKey,
      )} **${amount} ${token.toUpperCase()}**`,
      `${getEmoji("SHARE")}\`Recipient.     \` ${transferTarget}`,
      ...(isDm
        ? [
            `${getEmoji(
              "ANIMATED_STAR",
              true,
            )}\`See request.   \` ${messageLink}`,
            `${getEmoji(
              "ANIMATED_VAULT",
              true,
            )}\`Vault.         \` ${vaultName}`,
          ]
        : []),
      `${getEmoji("ANIMATED_ROBOT", true)}\`Message.       \` ${
        dataTransferTreasurerReq?.request.message ?? ""
      }`,
    ].join("\n")

  const embed = composeEmbedMessage(null, {
    author: ["New vault transfer request", getEmojiURL(emojis.PROPOSAL)],
    description: description(),
    footer: ["We'll notify you once this get approved"],
    color: msgColors.BLUE,
  })

  const requestMessage = (await i.editReply({
    embeds: [embed],
  })) as Message

  // send DM to submitter
  // send DM to list treasurer but not requester, requester default approve
  if (!dataTransferTreasurerReq?.is_decided_and_executed) {
    dataTransferTreasurerReq?.treasurer.forEach((treasurer: any) => {
      if (treasurer.user_profile_id === requesterProfileId) {
        return
      }
      const actionRow = new MessageActionRow().addComponents(
        new MessageButton({
          customId: `treaTransfer-approved-${dataTransferTreasurerReq?.request.id}-${dataTransferTreasurerReq?.request.vault_id}-${treasurer.user_profile_id}-${amount}-${token}-${chain}-${i.channelId}-${userId}`,
          style: "SUCCESS",
          label: "Approve",
        }),
        new MessageButton({
          customId: `treaTransfer-rejected-${dataTransferTreasurerReq?.request.id}-${dataTransferTreasurerReq?.request.vault_id}-${treasurer.user_profile_id}-${amount}-${token}-${chain}-${i.channelId}-${userId}`,
          style: "DANGER",
          label: "Reject",
        }),
      )

      i.guild?.members.fetch(treasurer.user_discord_id).then((treasurer) => {
        wrapError(i, async () => {
          await treasurer.send({
            embeds: [
              composeEmbedMessage(null, {
                author: ["Vault transfer", getEmojiURL(emojis.BELL)],
                description: description(true, requestMessage.url),
                footer: ["We'll notify you once this get approved"],
                color: msgColors.BLUE,
              }),
            ],
            components: [actionRow],
          })
        })
      })
    })
  }
  return
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
    submitter_profile_id: submitter,
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
            "ANIMATED_HEART",
          )}`,
        }),
      ],
      components: [],
    })
  }
}
