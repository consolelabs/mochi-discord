import config from "adapters/config"
import { CommandInteraction, GuildMember } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { getEmoji, hasAdministrator, msgColors } from "utils/common"
import { getErrorEmbed } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"

export async function runCreateVault({
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

  const { data, ok, curl, error, log } = await config.createVault({
    guild_id: guildId,
    name: i.options.getString("name", true),
    threshold: i.options.getString("threshold", true),
    vault_creator: i.user.id,
  })
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }

  const description = `**Wallet Address**\n\n\`0x140dd183e18ba39bd9BE82286ea2d96fdC48117A\`\n\n**Vault Threshold** \`${
    data.threshold
  }%\`\n\n${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true
  )} See all vaults </vault list:${await getSlashCommand("vault")}>\n${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true
  )} See detail a vault </vault info:${await getSlashCommand("vault")}>`

  const embed = new MessageEmbed()
    .setTitle(`${getEmoji("CHECK")}**${data.name} vault successfully created**`)
    .setDescription(description)
    .setColor(msgColors.MOCHI)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1090195482506174474/1090905984299442246/image.png"
    )

  return { messageOptions: { embeds: [embed] } }
}
