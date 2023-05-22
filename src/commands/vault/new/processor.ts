import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { MessageEmbed } from "discord.js"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
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

  const { data, ok, error } = await config.createVault({
    guild_id: guildId,
    name: i.options.getString("name", true),
    threshold: i.options.getString("threshold", true),
    desig_mode: i.options.getBoolean("desig", false) ?? false,
    vault_creator: i.user.id,
  })
  if (!ok) {
    throw new InternalError({ description: error, msgOrInteraction: i })
  }

  const description = `**Wallet Address**\n\`\`\`${
    data.wallet_address
  }\`\`\`\n**Solana Wallet Address**\n\`\`\`${
    data.solana_wallet_address
  }\`\`\`\n**Vault Threshold** \`${data.threshold}%\`\n\n${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true
  )} See all vaults </vault list:${await getSlashCommand("vault")}>\n${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true
  )} See a vault detail </vault info:${await getSlashCommand("vault")}>`

  const embed = new MessageEmbed()
    .setTitle(`${getEmoji("CHECK")}**${data.name} vault successfully created**`)
    .setDescription(description)
    .setColor(msgColors.BLUE)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())
    .setThumbnail(getEmojiURL(emojis.ANIMATED_OPEN_VAULT))

  return { messageOptions: { embeds: [embed] } }
}
