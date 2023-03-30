import config from "adapters/config"
import { CommandInteraction, GuildMember } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { getEmoji, hasAdministrator, msgColors } from "utils/common"
import { getErrorEmbed } from "ui/discord/embed"

export async function runCreateChannel({
  i,
  guildId,
}: {
  i: CommandInteraction
  guildId?: string | null
}) {
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }

  const member = i.member as GuildMember
  if (!hasAdministrator(member)) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "You don't have permission to do this!",
          }),
        ],
      },
    }
  }

  const channelArg = i.options.getString("channel")
  if (
    !channelArg ||
    !channelArg.startsWith("<#") ||
    !channelArg.endsWith(">")
  ) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "Invalid channel. Please choose another one!",
          }),
        ],
      },
    }
  }

  const vaultLogChannel = channelArg.substring(2, channelArg.length - 1)

  const { ok, curl, error, log } = await config.createVaultConfigChannel({
    guild_id: guildId,
    channel_id: vaultLogChannel,
  })
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }

  const embed = new MessageEmbed()
    .setTitle(
      `${getEmoji("APPROVE_VAULT")} Vault log successfully created${getEmoji(
        "BLANK"
      ).repeat(5)}`
    )
    .setDescription(
      `All the requests will be posted in the <#${vaultLogChannel}>`
    )
    .setColor(msgColors.GREEN)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())

  return { messageOptions: { embeds: [embed] } }
}
