import { Message } from "discord.js"
import {
  Command,
  RoleReactionConfigResponse,
  RoleReactionEvent
} from "types/common"
import { composeEmbedMessage } from "utils/discord-embed"
import reactionRole from "adapters/reactionRole"
import { getCommandArguments } from "utils/common"
import { PREFIX } from "utils/constants"
import { BotBaseError } from "errors"

const getRoleNameById = (msg: Message, roleId: string) => {
  return msg.guild.roles.cache.find(r => r.id === roleId).name
}

const command: Command = {
  id: "reactionrole",
  brief: "Configure reaction emoji for user to self-assign their roles",
  command: "reactionrole",
  aliases: ["rr"],
  category: "Config",
  canRunWithoutAction: true,
  run: async (msg: Message) => {
    const args = getCommandArguments(msg)
    let description = ""
    args.forEach(async val => {
      if (!val) return
    })
    if (args.length === 4) {
      const reaction = args[2].trim()
      const role_id = args[3].trim().replace(/\D/g, "") // Accept number-only characters
      const requestData: RoleReactionEvent = {
        guild_id: msg.guild.id,
        message_id: args[1],
        reaction,
        role_id
      }
      const config: RoleReactionConfigResponse = await reactionRole.updateReactionConfig(
        requestData
      )
      if (config.success) {
        description = `${
          requestData.reaction
        } is now setting to this role **${getRoleNameById(
          msg,
          requestData.role_id
        )}**`
        msg.channel.messages
          .fetch(requestData.message_id)
          .then(val => val.react(requestData.reaction))
          .catch(err => {
            throw new BotBaseError(err)
          })
      } else {
        description = `${requestData.reaction} has already been configured, please try to set another one`
      }
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "Reaction Role",
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
        title: "Role Reaction",
        usage: `${PREFIX}reactionrole <message_id> <select_emoji> <role_id>`,
        examples: `${PREFIX}rr 967107573591457832 🎉 967013125847121973`
      })
    ]
  })
}

export default command
