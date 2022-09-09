import { Command } from "types/common"
import { DEFAULT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"

const command: Command = {
  id: "defaultrole_info",
  command: "info",
  brief: "Show current default role for newcomers",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guildId || !msg.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    let description = "No default role found, to set one, run `$dr set @<role>`"
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

    const res = await config.getCurrentDefaultRole(msg.guildId)
    if (res.ok) {
      if (res.data.role_id) {
        description = `When people first join your server, their base role will be <@&${res.data.role_id}>`
      } else {
        description = `No default role set`
      }
    } else {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: res.error })],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: `${msg.guild.name}'s default role`,
            description,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}dr info`,
          examples: `${PREFIX}dr info`,
          document: DEFAULT_ROLE_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
