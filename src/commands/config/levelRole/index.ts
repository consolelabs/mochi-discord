import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { getEmoji } from "utils/common"
import { PREFIX, LEVEL_ROLE_GITBOOK } from "utils/constants"
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
  brief: "Level Role Configuration",
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
          embeds: [
            getErrorEmbed({
              msg,
              description:
                "Invalid role. Be careful to not be mistaken role with username while setting.",
            }),
          ],
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
  featured: {
    title: `${getEmoji("")} Level role`,
    description: "Assign a role to users when they reach a certain level",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}lr <role> <level>\n${PREFIX}lr <action>`,
        examples: `${PREFIX}levelrole list\n${PREFIX}levelrole @Mochi 1\n${PREFIX}lr @admin 2`,
        description: "Assign a role to users when they reach a certain level",
        document: LEVEL_ROLE_GITBOOK,
        footer: [
          `Type ${PREFIX}help levelrole <action> for a specific action!`,
        ],
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
