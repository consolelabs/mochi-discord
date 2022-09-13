import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
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
    if (Number.isNaN(level) || level <= 0 || level >= Infinity)
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Invalid level" })],
        },
      }

    const res = await Config.configLevelRole({
      guild_id: msg.guildId,
      role_id: role.id,
      level,
    })
    if (res.ok) {
      return {
        messageOptions: {
          embeds: [
            getSuccessEmbed({
              msg,
              description: `Successfully configured role <@&${role.id}> for level ${level}`,
            }),
          ],
        },
      }
    }
    let description
    if (res.error.toLowerCase().includes("role has been used")) {
      description = res.error
    }
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ msg, description })],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}lr <role> <level>\n${PREFIX}lr <action>`,
        examples: `${PREFIX}levelrole list\n${PREFIX}levelrole @Mochi 1\n${PREFIX}lr @admin 2`,
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
