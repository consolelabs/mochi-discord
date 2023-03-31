import config from "adapters/config"
import { CommandInteraction, GuildMember } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { getEmoji, hasAdministrator, msgColors } from "utils/common"

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
