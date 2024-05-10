import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { getSlashCommand } from "utils/commands"
import { getProfileIdByDiscord } from "utils/profile"

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
  const profileId = await getProfileIdByDiscord(i.user.id)
  const type = i.options.getString("type", false) || "spot"

  if (type === "trading") {
    return {
      messageOptions: { content: "create trading vault" },
    }
  }

  const { data, status, originalError } = await config.createVault({
    guild_id: guildId,
    name: i.options.getString("name", true),
    threshold: i.options.getString("threshold", true),
    desig_mode: i.options.getBoolean("desig", false) ?? false,
    vault_creator: profileId,
  })
  if (status === 400 && originalError) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Create new vault failed",
      description: originalError,
    })
  }

  const description = `**Wallet Address**\n\`\`\`EVM | ${data?.wallet_address}\nSOL | ${data?.solana_wallet_address}\`\`\`\n**Vault Threshold** \`${data?.threshold}%\`\n\n${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true,
  )} See all vaults ${await getSlashCommand("vault list")}\n${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true,
  )} See a vault detail ${await getSlashCommand("vault info")}`

  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("CHECK")}**${data?.name} vault successfully created**`,
    description: description,
    color: msgColors.BLUE,
    thumbnail: getEmojiURL(emojis.ANIMATED_OPEN_VAULT),
  })

  return { messageOptions: { embeds: [embed] } }
}
