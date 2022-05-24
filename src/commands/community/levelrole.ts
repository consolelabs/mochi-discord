import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import Config from "../../adapters/config"

const command: Command = {
  id: "levelrole",
  command: "levelrole",
  brief:
    "Set roles which users will get when reaching levels in current server",
  category: "Config",
  onlyAdministrator: true,
  run: async function(msg: Message) {
    const args = getCommandArguments(msg)
    if (args.length < 3) {
      return {
        messageOptions: await this.getHelpMessage(msg)
      }
    }

    const [roleArg, levelArg] = args.slice(1)
    if (!roleArg.startsWith("<@&") || !roleArg.endsWith(">")) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Invalid role" })]
        }
      }
    }

    const roleId = roleArg.substring(3, roleArg.length - 1)
    const role = await msg.guild.roles.fetch(roleId)
    if (!role) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Role not found" })]
        }
      }
    }

    const level = +levelArg
    if (isNaN(level) || level === 0)
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Invalid level" })]
        }
      }

    await Config.configLevelRole(msg, {
      guild_id: msg.guildId,
      role_id: role.id,
      level
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `Successfully configured role <@&${role.id}> for level ${level}`
          })
        ]
      }
    }
  },
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}lr <@role> <level>`,
        examples: `${PREFIX}lr @Mochi 1`
      })
    ]
  }),
  canRunWithoutAction: true,
  aliases: ["lr"]
}

export default command
