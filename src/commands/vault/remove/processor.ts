import config from "adapters/config"
import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  ButtonInteraction,
} from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { getEmoji, msgColors } from "utils/common"
import {
  getErrorEmbed,
  composeEmbedMessage,
  getSuccessEmbed,
} from "ui/discord/embed"

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

  const vaultName = i.options.getString("name") ?? ""
  const {
    data: dataAddTreasurerReq,
    status: statusAddTreasurerReq,
    curl: curlAddTreasurerReq,
    log: logAddTreasurerReq,
    originalError: originalErrorAddTreasurerReq,
  } = await config.createAddTreasureRequest({
    guild_id: guildId,
    user_discord_id: user.id,
    vault_name: vaultName,
    message: i.options.getString("message") ?? "",
    type: "add",
    requester: i.user.id,
  })

  if (statusAddTreasurerReq !== 200 && statusAddTreasurerReq !== 400) {
    throw new APIError({
      curl: curlAddTreasurerReq,
      description: logAddTreasurerReq,
    })
  }

  if (statusAddTreasurerReq === 400) {
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
  dataAddTreasurerReq?.treasurer.forEach((treasurer: any) => {
    const actionRow = new MessageActionRow().addComponents(
      new MessageButton({
        customId: `treasurerAdd-approved-${dataAddTreasurerReq?.request.id}-${dataAddTreasurerReq?.request.vault_id}-${dataAddTreasurerReq?.request.requester}-${dataAddTreasurerReq?.request.user_discord_id}-${i.channelId}`,
        style: "SUCCESS",
        label: "Approve",
      }),
      new MessageButton({
        customId: `treasurerAdd-rejected-${dataAddTreasurerReq?.request.id}-${dataAddTreasurerReq?.request.vault_id}-${dataAddTreasurerReq?.request.requester}-${dataAddTreasurerReq?.request.user_discord_id}-${i.channelId}}`,
        style: "DANGER",
        label: "Reject",
      })
    )

    i.guild?.members.fetch(treasurer.user_discord_id).then((treasurer) => {
      treasurer.send({
        embeds: [
          composeEmbedMessage(null, {
            title: `${getEmoji("BELL")} Mochi notifications`,
            description: `**Approval Request #${
              dataAddTreasurerReq?.request.id
            }**\n<@${i.user.id}> has submitted a request\n${getEmoji(
              "TREASURER"
            )} Add <@${user.id}> to **${vaultName}**\nMessage ${getEmoji(
              "MESSAGE2"
            )}\n \`\`\`${dataAddTreasurerReq?.request.message}\`\`\``,
            color: msgColors.MOCHI,
            thumbnail:
              "https://cdn.discordapp.com/attachments/1090195482506174474/1092703907911847976/image.png",
          }),
        ],
        components: [actionRow],
      })
    })
  })

  // send DM to treasurer in vault

  const embed = new MessageEmbed()
    .setTitle(
      `${getEmoji("PROPOSAL")} Request #${
        dataAddTreasurerReq?.request.id
      } successfully created`
    )
    .setDescription(
      `You want to add <@${
        user.id
      }> to **${vaultName} vault**\n\nMessage ${getEmoji("MESSAGE2")}\n\`\`\`${
        dataAddTreasurerReq?.request.message
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

export async function handleTreasurerAdd(i: ButtonInteraction) {
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
    data: dataAddTreasurer,
    status,
    curl,
    log,
    originalError,
  } = await config.createTreasurerSubmissions({
    vault_id: Number(vaultId),
    request_id: Number(requestId),
    submitter: submitter,
    choice: choice,
  })

  if ((status !== 200 && status !== 400) || !dataAddTreasurer) {
    throw new APIError({
      curl: curl,
      description: log,
    })
  }

  if (status === 400) {
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

  if (dataAddTreasurer.vote_result.is_approved === true) {
    // add treasurer to vault
    const { data, status, curl, log } = await config.addTreasurerToVault({
      guild_id: dataAddTreasurer.submission.guild_id,
      user_discord_id: user,
      vault_id: Number(vaultId),
      channel_id: channelId,
    })
    if ((status !== 200 && status !== 400) || !data) {
      throw new APIError({
        curl: curl,
        description: log,
      })
    }
  }

  await i.editReply({
    embeds: [
      getSuccessEmbed({
        title: "Successfully voted",
        description: `You have updated your vote successfully. Thank you for your vote ${getEmoji(
          "HEART"
        )}`,
      }),
    ],
  })
}
