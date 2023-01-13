import config from "adapters/config"
import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { defaultEmojis, getEmoji } from "utils/common"
import { LEVEL_ROLE_GITBOOK, PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"

const command: Command = {
  id: "lr_set",
  command: "set",
  brief: "Level Role Configuration",
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
    const args = getCommandArguments(msg)
    const [roleArg, levelArg] = args.slice(2)
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

    const res = await config.configLevelRole({
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
        examples: `${PREFIX}levelrole list\n${PREFIX}levelrole set @Mochi 1\n${PREFIX}lr set @admin 2`,
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
  colorType: "Server",
  minArguments: 4,
}

export default command
