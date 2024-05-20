import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, msgColors } from "utils/common"

export async function runCreateKey({
  i,
  guildId,
}: {
  i: CommandInteraction
  guildId?: string | null
}) {
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }

  const apiKey = i.options.getString("api_key", true)
  const secretKey = i.options.getString("secret_key", true)

  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("CHECK")} Vault key successfully set ${getEmoji(
      "BLANK",
    ).repeat(5)}`,
    color: msgColors.BLUE,
    thumbnail:
      "https://cdn.discordapp.com/attachments/1090195482506174474/1090906036464005240/image.png",
  })

  return { messageOptions: { embeds: [embed] } }
}
