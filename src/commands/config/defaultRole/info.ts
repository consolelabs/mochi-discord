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

  let description = `No default role found! To set, run \`\`\`${PREFIX}dr set @<role>\`\`\``

  const res = await config.getCurrentDefaultRole(msg.guildId)
  if (res.ok) {
    if (res.data.role_id) {
      description = `When people first join your server, their base role will be <@&${res.data.role_id}>`
    } else {
      description = `No default role found! To set, run \`\`\`${PREFIX}dr set @<role>\`\`\``
    }
  } else {
    throw new APIError({
      curl: res.curl,
      error: res.error,
      description: res.log,
      message: msg,
    })
  }

  const embed =
    msg instanceof Message
      ? composeEmbedMessage(msg, {
          author: ["Default role", getEmojiURL(emojis.NEKO1)],
          description,
        })
      : composeEmbedMessage2(msg as CommandInteraction, {
          author: ["Default role", getEmojiURL(emojis.NEKO1)],
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
