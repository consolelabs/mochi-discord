import config from "adapters/config"
import { CommandInteraction, Message } from "discord.js"
import { APIError, GuildIdNotFoundError, OriginalMessage } from "errors"
import { emojis, getEmojiURL, msgColors } from "utils/common"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"

export async function handle(msg: OriginalMessage, statusText = "") {
  if (!msg.guildId) {
    throw new GuildIdNotFoundError({})
  }

  const result = {
    isError: true,
    description: `You haven't set any default roles yet! To set a new one, run ${await getSlashCommand(
      "role default set",
    )}\nThen re-check your configuration with ${await getSlashCommand(
      "role default info",
    )}\nOr you can remove it later using ${await getSlashCommand(
      "role default remove",
    )}.`,
  }

  const res = await config.getCurrentDefaultRole(msg.guildId)
  if (res.ok) {
    if (res.data.role_id) {
      result.description = `When people first join your server, their base role will be <@&${res.data.role_id}>`
      result.isError = false
    }
  } else {
    throw new APIError({
      curl: res.curl,
      error: res.error,
      description: res.log,
      msgOrInteraction: msg,
      status: res.status ?? 500,
    })
  }

  const { description, isError } = result
  const embed =
    msg instanceof Message
      ? composeEmbedMessage(msg, {
          author: [
            isError ? "No default roles found" : "Default role",
            isError ? getEmojiURL(emojis.REVOKE) : getEmojiURL(emojis.NEKO1),
          ],
          description,
          color: msgColors.PINK,
        })
      : composeEmbedMessage2(msg as CommandInteraction, {
          author: [
            isError ? "No default roles found" : "Default role",
            isError ? getEmojiURL(emojis.REVOKE) : getEmojiURL(emojis.NEKO1),
          ],
          description,
          color: msgColors.PINK,
        })

  return {
    messageOptions: {
      ...(statusText ? { content: `> ${statusText}` } : {}),
      embeds: [embed],
    },
  }
}
