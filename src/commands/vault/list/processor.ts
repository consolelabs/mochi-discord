import config from "adapters/config"
import { Message } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, msgColors } from "utils/common"

export async function runVaultList({
  msg,
  guildId,
}: {
  msg?: Message
  guildId?: string | null
}) {
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: msg })
  }

  const { data, ok, curl, error, log } = await config.vaultList(guildId)
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }

  if (!data) {
    return {
      messageOptions: {
        embed: composeEmbedMessage(msg, {
          title: "Empty list vault",
          description: `${getEmoji(
            "POINTINGRIGHT"
          )} This guild does not have any vault yet`,
          color: msgColors.ERROR,
        }),
      },
    }
  }

  let description = ""
  for (let i = 0; i < data.slice(0, 10).length; i++) {
    description = description + `${getEmoji(`NUM_${i}`)} ${data[i].name}\n`
  }

  description += `\n${getEmoji(
    "POINTINGRIGHT"
  )} View detail of the vault \`$vault <name>\``

  const embed = new MessageEmbed()
    .setTitle(`${getEmoji("MOCHI_CIRCLE")} Vault List`)
    .setDescription(description)
    .setColor(msgColors.MOCHI)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1085876941011304538/1087602219605573652/mail.png"
    )

  return { messageOptions: { embeds: [embed] } }
}
