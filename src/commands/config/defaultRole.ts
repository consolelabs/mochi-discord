import { Message } from "discord.js"
import { Command, DefaultRoleEvent } from "types/common"
import { composeEmbedMessage } from "utils/discord-embed"
import { getCommandArguments } from "utils/common"
import { PREFIX } from "utils/constants"
import defaultRole from "adapters/defaultRole"

const TITLE = "Default role"

const getRoleNameById = (msg: Message, roleId: string) => {
  return msg.guild.roles.cache.find(r => r.id === roleId).name
}

const command: Command = {
  id: "defaultrole",
  brief: "Set user's default role when hopping into the server",
  command: "defaultrole",
  aliases: ["dr"],
  category: "Config",
  canRunWithoutAction: true,
  run: async (msg: Message) => {
    const args = getCommandArguments(msg)
    let description = ""
    args.forEach(async val => {
      if (!val) return
    })
    if (args.length === 2) {
      const role_id = args[1].trim().replace(/\D/g, "") // Accept number-only characters
      const requestData: DefaultRoleEvent = {
        guild_id: msg.guild.id,
        role_id
      }
      const config = await defaultRole.configureDefaultRole(requestData)

      if (config.success) {
        description = `Role **${getRoleNameById(
          msg,
          requestData.role_id
        )}** is now configured as user's default role`
      } else {
        description = `Role **${getRoleNameById(
          msg,
          requestData.role_id
        )}** has already been configured, please try to set another one`
      }
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: TITLE,
              description
            })
          ]
        }
      }
    }
  },
  getHelpMessage: async (msg: Message) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: TITLE,
        description: "",
        usage: `${PREFIX}defaultrole <role_id> (Or @<role_name>)`,
        examples: `${PREFIX}dr 967013125847121973`
      })
    ]
  })
}

export default command

