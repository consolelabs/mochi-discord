import config from "adapters/config"
import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  ButtonInteraction,
} from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { APIError } from "errors"
import { getEmoji, msgColors, emojis, getEmojiURL } from "utils/common"
import {
  getErrorEmbed,
  composeEmbedMessage,
  getSuccessEmbed,
} from "ui/discord/embed"
import { getProfileIdByDiscord } from "utils/profile"

export async function runRemoveTreasurer({
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

  const userProfileId = await getProfileIdByDiscord(user.id)
  const requesterProfileId = await getProfileIdByDiscord(i.user.id)

  const vaultName = i.options.getString("name") ?? ""
  const {
    data: dataAddTreasurerReq,
    status: statusAddTreasurerReq = 500,
    curl: curlAddTreasurerReq,
    log: logAddTreasurerReq,
    originalError: originalErrorAddTreasurerReq,
  } = await config.createTreasureRequest({
    guild_id: guildId,
    user_profile_id: userProfileId,
    vault_name: vaultName,
    message: i.options.getString("message")?.trim() || "Remove treasurer",
    type: "remove",
    requester_profile_id: requesterProfileId,
    message_url: `https://discord.com/channels/${i.guildId}/${i.channelId}/${i.id}`,
  })

  if (statusAddTreasurerReq !== 200 && statusAddTreasurerReq !== 400) {
    throw new APIError({
      curl: curlAddTreasurerReq,
      description: logAddTreasurerReq,
      status: statusAddTreasurerReq,
    })
  }

  if (statusAddTreasurerReq === 400 && originalErrorAddTreasurerReq) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: originalErrorAddTreasurerReq,
          }),
        ],
      },
    }
  }

  // send DM to submitter
  // send DM to list treasurer but not requester, requester default approve
  if (!dataAddTreasurerReq?.is_decided_and_executed) {
    dataAddTreasurerReq?.treasurer.forEach((treasurer: any) => {
      if (treasurer.user_profile_id === requesterProfileId) {
        return
      }

      const actionRow = new MessageActionRow().addComponents(
        new MessageButton({
          customId: `treasurerRemove-approved-${dataAddTreasurerReq?.request.id}-${dataAddTreasurerReq?.request.vault_id}-${treasurer.user_profile_id}-${dataAddTreasurerReq?.request.user_profile_id}-${i.channelId}`,
          style: "SUCCESS",
          label: "Approve",
        }),
        new MessageButton({
          customId: `treasurerRemove-rejected-${dataAddTreasurerReq?.request.id}-${dataAddTreasurerReq?.request.vault_id}-${treasurer.user_profile_id}-${dataAddTreasurerReq?.request.user_profile_id}-${i.channelId}`,
          style: "DANGER",
          label: "Reject",
        }),
      )

      i.guild?.members
        .fetch(treasurer.user_discord_id)
        .then(async (treasurer) => {
          await treasurer.send({
            embeds: [
              composeEmbedMessage(null, {
                title: `${getEmoji("ANIMATED_BELL", true)} Mochi Notifications`,
                description: `<@${
                  i.user.id
                }> has submitted the request in ${vaultName} vault \n${getEmoji(
                  "TREASURER_REMOVE",
                )} Remove <@${
                  user.id
                }> from **${vaultName}**\n\nMessage ${getEmoji(
                  "ANIMATED_CHAT",
                  true,
                )}\n \`\`\`${dataAddTreasurerReq?.request.message}\`\`\``,
                color: msgColors.BLUE,
                thumbnail: getEmojiURL(emojis.TREASURER_ADD),
              }),
            ],
            components: [actionRow],
          })
        })
    })
  }

  // send DM to treasurer in vault
  const embed = composeEmbedMessage(null, {
    author: ["Remove treasurer", getEmojiURL(emojis.PROPOSAL)],
    description: `You want to remove <@${
      user.id
    }> from **${vaultName} vault**\n\nMessage ${getEmoji(
      "ANIMATED_CHAT",
      true,
    )}\n\`\`\`${dataAddTreasurerReq?.request
      .message}\`\`\`\nWe'll notify you once all treasurers have accepted the request.`,
    color: msgColors.BLUE,
    thumbnail:
      "https://cdn.discordapp.com/attachments/1090195482506174474/1092755046556516394/image.png",
  })

  return { messageOptions: { embeds: [embed] } }
}

export async function handleTreasurerRemove(i: ButtonInteraction) {
  await i.deferUpdate()
  const args = i.customId.split("-")
  const choice = args[1]
  const requestId = args[2]
  const vaultId = args[3]
  // const guildId = args[4]
  const submitter = args[4]
  const user = args[5]
  const channelId = args[6]

  const {
    data: dataTreasurerSubmisison,
    status = 500,
    curl,
    log,
    originalError,
  } = await config.createTreasurerSubmissions({
    vault_id: Number(vaultId),
    request_id: Number(requestId),
    submitter_profile_id: submitter,
    choice: choice,
    type: "remove",
  })

  if ((status !== 200 && status !== 400) || !dataTreasurerSubmisison) {
    throw new APIError({
      curl: curl,
      description: log,
      status,
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

  if (dataTreasurerSubmisison.vote_result.is_approved) {
    // add treasurer to vault
    const {
      data,
      status = 500,
      curl,
      log,
    } = await config.removeTreasurerFromVault({
      guild_id: dataTreasurerSubmisison.submission.guild_id,
      user_profile_id: user,
      vault_id: Number(vaultId),
      channel_id: channelId,
    })
    if ((status !== 200 && status !== 400) || !data) {
      throw new APIError({
        curl: curl,
        description: log,
        status,
      })
    }

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
