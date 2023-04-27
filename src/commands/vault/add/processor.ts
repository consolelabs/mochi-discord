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
import { getEmoji, msgColors } from "utils/common"
import NodeCache from "node-cache"
import {
  getErrorEmbed,
  composeEmbedMessage,
  getSuccessEmbed,
} from "ui/discord/embed"

export const treasurerAddCache = new NodeCache({
  stdTTL: 0,
  checkperiod: 1,
  useClones: false,
})

export async function runAddTreasurer({
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
  dataAddTreasurerReq?.treasurer.forEach((treasurer: any) => {
    const actionRow = new MessageActionRow().addComponents(
      new MessageButton({
        customId: `treasurerAdd-approved-${dataAddTreasurerReq?.request.id}-${dataAddTreasurerReq?.request.vault_id}-${treasurer.user_discord_id}-${dataAddTreasurerReq?.request.user_discord_id}-${i.channelId}`,
        style: "SUCCESS",
        label: "Approve",
      }),
      new MessageButton({
        customId: `treasurerAdd-rejected-${dataAddTreasurerReq?.request.id}-${dataAddTreasurerReq?.request.vault_id}-${treasurer.user_discord_id}-${dataAddTreasurerReq?.request.user_discord_id}-${i.channelId}`,
        style: "DANGER",
        label: "Reject",
      })
    )

    const cacheKey = `treasurerAdd-${dataAddTreasurerReq?.request.id}-${dataAddTreasurerReq?.request.vault_id}-${treasurer.user_discord_id}-${dataAddTreasurerReq?.request.user_discord_id}-${i.channelId}`

    i.guild?.members
      .fetch(treasurer.user_discord_id)
      .then(async (treasurer) => {
        const msg = await treasurer.send({
          embeds: [
            composeEmbedMessage(null, {
              title: `${getEmoji("ANIMATED_BELL", true)} Mochi notifications`,
              description: `**Approval Request #${
                dataAddTreasurerReq?.request.id
              }**\n<@${i.user.id}> has submitted a request\n${getEmoji(
                "TREASURER_ADD"
              )} Add <@${user.id}> to **${vaultName}**\nMessage ${getEmoji(
                "ANIMATED_CHAT",
                true
              )}\n \`\`\`${dataAddTreasurerReq?.request.message}\`\`\``,
              color: msgColors.MOCHI,
              thumbnail:
                "https://cdn.discordapp.com/attachments/1090195482506174474/1092703907911847976/image.png",
            }),
          ],
          components: [actionRow],
        })

        treasurerAddCache.set(cacheKey, msg)
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
      }> to **${vaultName} vault**\n\nMessage ${getEmoji(
        "ANIMATED_CHAT",
        true
      )}\n\`\`\`${
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
    type: "add",
  })

  if ((status !== 200 && status !== 400) || !dataAddTreasurer) {
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
    guild_id: dataAddTreasurer.submission.guild_id,
    user_discord_id: user,
    vault_id: Number(vaultId),
    channel_id: channelId,
    type: "add",
    status: "",
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
    Array.from(treasurerAddCache.keys())
      .filter((key) => key.includes(`treasurerAdd-${requestId}-${vaultId}`))
      .forEach(async (key) => {
        const msg = treasurerAddCache.get(key) as Message
        if (msg) {
          await msg.edit({
            embeds: [
              getSuccessEmbed({
                title: `Approved ${requestId}!!!`,
                description: `Request has already been approved by majority treasurers \`${dataAddTreasurer.vote_result.total_approved_submission}/${dataAddTreasurer.vote_result.total_submission}\``,
              }),
            ],
            components: [],
          })
        }
        treasurerAddCache.del(key)
      })
  } else {
    if (
      dataAddTreasurer.vote_result.total_rejected_submisison >
      dataAddTreasurer.vote_result.allowed_rejected_submisison
    ) {
      modelNotify.status = "fail"
      // send notify
      await config.createTreasurerResult(modelNotify)

      // get all key in cache
      Array.from(treasurerAddCache.keys())
        .filter((key) => key.includes(`treasurerAdd-${requestId}-${vaultId}`))
        .forEach(async (key) => {
          const msg = treasurerAddCache.get(key) as Message
          if (msg) {
            await msg.edit({
              embeds: [
                getErrorEmbed({
                  title: `Rejected ${requestId}!!!`,
                  description: `Request has already been rejected by majority treasurers \`${dataAddTreasurer.vote_result.total_rejected_submisison}/${dataAddTreasurer.vote_result.total_submission}\``,
                }),
              ],
              components: [],
            })
          }
          treasurerAddCache.del(key)
        })
    }
  }
}
