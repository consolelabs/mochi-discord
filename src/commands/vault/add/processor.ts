import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { getEmoji, msgColors } from "utils/common"
import { getErrorEmbed } from "ui/discord/embed"

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

  // TODO: currently add treasurer directly after create request, in the future:
  // - create req -> send DM to user with approve/ reject button
  // - api add treasurer should be add to interaction of buttion approve / reject
  //   const embed = new MessageEmbed()
  //     .setTitle(
  //       `${getEmoji("PROPOSAL")} Request #${data.id} successfully created`
  //     )
  //     .setDescription(
  //       `You want to add <@${
  //         user.id
  //       }> to **${vaultName} vault**\nMessage ${getEmoji("MESSAGE2")}\n\n\`${
  //         data.message
  //       }\`\n\nWe'll notify you once all treasurers have accepted the request.`
  //     )
  //     .setColor(msgColors.GREEN)
  //     .setFooter({ text: "Type /feedback to report • Mochi Bot" })
  //     .setTimestamp(Date.now())

  const {
    status: statusAddTreasurer,
    curl: curlAddTreasurer,
    log: logAddTreasurer,
    originalError: originalErrorAddTreasurer,
  } = await config.addTreasurerToVault({
    request_id: dataAddTreasurerReq?.id,
  })

  if (statusAddTreasurer !== 200 && statusAddTreasurer !== 400) {
    throw new APIError({
      curl: curlAddTreasurer,
      description: logAddTreasurer,
    })
  }

  if (statusAddTreasurer === 400) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: originalErrorAddTreasurer,
          }),
        ],
      },
    }
  }

  const embed = new MessageEmbed()
    .setTitle(`${getEmoji("APPROVE_VAULT")} Treasurer was successfullly added`)
    .setDescription(`<@${user.id}> has been added to **${vaultName} vault**`)
    .setColor(msgColors.GREEN)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())

  return { messageOptions: { embeds: [embed] } }
}
