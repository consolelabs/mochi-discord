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

  const vaults = data.slice(0, 9)
  let description = ""
  const longest = vaults.reduce(
    (acc: number, c: any) => Math.max(acc, c.name.length),
    0
  )
  for (let i = 0; i < vaults.length; i++) {
    description += `${getEmoji(`NUM_${i + 1}` as EmojiKey)}\`${
      data[i].name
    } ${" ".repeat(longest - data[i].name.length)} | ${shortenHashOrAddress(
      data[i].wallet_address
    )} | ${" ".repeat(3 - data[i].threshold.toString().length)}${
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
