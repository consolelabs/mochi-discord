import { Command } from "types/common"
import { DEFAULT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage, composeEmbedMessage2 } from "utils/discordEmbed"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import { emojis, getEmojiURL } from "utils/common"
import { APIError, GuildIdNotFoundError, OriginalMessage } from "errors"
import { CommandInteraction, Message } from "discord.js"

export async function handle(msg: OriginalMessage, statusText = "") {
  if (!msg.guildId) {
    throw new GuildIdNotFoundError({})
  }

  const result = {
    isError: true,
    description: `You haven't set any default roles yet! To set a new one, run \`\`\`${PREFIX}dr set @<role>\`\`\`\nThen re-check your configuration with \`${PREFIX}dr info\`\nOr you can remove it later using \`${PREFIX}dr remove\`.`,
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
      message: msg,
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
        })
      : composeEmbedMessage2(msg as CommandInteraction, {
          author: [
            isError ? "No default roles found" : "Default role",
            isError ? getEmojiURL(emojis.REVOKE) : getEmojiURL(emojis.NEKO1),
          ],
          description,
        })

  return {
    messageOptions: {
      ...(statusText ? { content: `> ${statusText}` } : {}),
      embeds: [embed],
    },
  }
}

const command: Command = {
  id: "defaultrole_info",
  command: "info",
  brief: "Show current default role for newcomers",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg) => {
    const args = getCommandArguments(msg)

    if (args.length !== 2) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              usage: `${PREFIX}dr info`,
              examples: `${PREFIX}dr info`,
            }),
          ],
        },
      }
    }

    return handle(msg)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}dr info`,
          examples: `${PREFIX}dr info`,
          document: `${DEFAULT_ROLE_GITBOOK}&action=info`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
