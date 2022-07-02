import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import Config from "../../../adapters/config"
import list from "./list"
import remove from "./remove"

const actions: Record<string, Command> = {
  list,
  remove,
}

const command: Command = {
  id: "levelrole",
  command: "levelrole",
  brief: "Set a role that users will get when they reach specific a level",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const [roleArg, levelArg] = args.slice(1)
    if (!roleArg.startsWith("<@&") || !roleArg.endsWith(">")) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Invalid role" })],
        },
      }
    }

    const roleId = roleArg.substring(3, roleArg.length - 1)
    const role = await msg.guild.roles.fetch(roleId)
    if (!role) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Role not found" })],
        },
      }
    }

    const level = +levelArg
    if (isNaN(level) || level === 0)
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Invalid level" })],
        },
      }

    await Config.configLevelRole(msg, {
      guild_id: msg.guildId,
      role_id: role.id,
      level,
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `Successfully configured role <@&${role.id}> for level ${level}`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}lr <role> <level>\n${PREFIX}lr <action>`,
        examples: `${PREFIX}lr @Mochi 1`,
        includeCommandsList: true,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["lr"],
  actions,
  colorType: "Server",
  minArguments: 3,
}

export default command
