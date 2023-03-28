import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { getEmoji, msgColors } from "utils/common"

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

  const { data, ok, curl, error, log } = await config.createVault({
    guild_id: guildId,
    name: i.options.getString("name", true),
    threshold: i.options.getString("threshold", true),
  })
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }

  const description = `**Wallet Address**\n\n\`0x140dd183e18ba39bd9BE82286ea2d96fdC48117A\`\n\n**Vault Threshold** \`${
    data.threshold
  }%\`\n\n${getEmoji(
    "POINTINGRIGHT"
  )} See all vaults \`$vault list\`\n${getEmoji(
    "POINTINGRIGHT"
  )} See detail a vault \`$vault <name>\``

  const embed = new MessageEmbed()
    .setTitle(
      `${getEmoji("APPROVE_VAULT")}**${data.name} vault successflly created**`
    )
    .setDescription(description)
    .setColor(msgColors.MOCHI)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1085876941011304538/1087602219605573652/mail.png"
    )

  return { messageOptions: { embeds: [embed] } }
}
