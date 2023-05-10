import config from "adapters/config"
import { Message } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  EmojiKey,
  getEmoji,
  msgColors,
  shortenHashOrAddress,
} from "utils/common"
import { getSlashCommand } from "utils/commands"

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
            "ANIMATED_POINTING_RIGHT",
            true
          )} This guild does not have any vault yet`,
          color: msgColors.ERROR,
        }),
      },
    }
  }

  let description = ""
  for (let i = 0; i < data.slice(0, 10).length; i++) {
    description =
      description +
      `${getEmoji(`NUM_${i + 1}` as EmojiKey)} ${
        data[i].name
      } \`${shortenHashOrAddress(data[i].wallet_address)}\` | Threshold: \`${
        data[i].threshold
      }%\`\n`
  }

  description += `\n${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true
  )} View detail of the vault </vault info:${await getSlashCommand("vault")}>`

  const embed = new MessageEmbed()
    .setTitle(`${getEmoji("MOCHI_CIRCLE")} Vault List`)
    .setDescription(description)
    .setColor(msgColors.BLUE)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())

  return { messageOptions: { embeds: [embed] } }
}
