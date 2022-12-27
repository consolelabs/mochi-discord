import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { defaultEmojis, getEmoji } from "utils/common"
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
              title: "Invalid role format",
              description: `Your role is in an invalid format. Make sure an “@” symbol is put before the role.\n\n${defaultEmojis.POINT_RIGHT} Type @ to see a role list.\n${defaultEmojis.POINT_RIGHT} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.`,
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
    let title
    if (res.error.toLowerCase().includes("role has been used")) {
      description = `Your role has been used for an existing NFT role. Please choose another one.\n\n${defaultEmojis.POINT_RIGHT} Type @ to see a role list.\n${defaultEmojis.POINT_RIGHT} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.`
      title = "Invalid roles"
    }
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ msg, description, title })],
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
