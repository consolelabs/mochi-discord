import { Message, MessageOptions, TextChannel } from "discord.js"
import {
  Command,
  RoleReactionConfigResponse,
  RoleReactionEvent
} from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { BotBaseError } from "errors"

const actionType = {
  UPDATE_REACTION_CONFIG: 4,
  LIST_ALL_REACTION_ROLES: 2
}

const executeAction = async (args: string[], msg: Message): Promise<MessageOptions>  => {
  let description = ""
  args = args.map(s => s.trim())
  
  switch (args.length) {
    case actionType.UPDATE_REACTION_CONFIG: {
      const reaction = args[2]
      const role_id = args[3].replace(/\D/g, "") // Accept number-only characters
      const requestData: RoleReactionEvent = {
        guild_id: msg.guild.id,
        message_id: args[1],
        reaction,
        role_id
      }
      const rrConfig: RoleReactionConfigResponse = await config.updateReactionConfig(
        requestData
      )
      if (rrConfig.success) {
        description = `${
          requestData.reaction
        } is now setting to this role <@&${requestData.role_id}>`
        msg.channel.messages
          .fetch(requestData.message_id)
          .then(val => val.react(requestData.reaction))
          .catch(err => {
            throw new BotBaseError(err)
          })
      } else {
        description = `${requestData.reaction} has already been configured, please try to set another one`
      }
    }

    case actionType.LIST_ALL_REACTION_ROLES: {
      if (args[1].toUpperCase() === 'LIST') {
        const rrList = await config.listAllReactionRoles(msg.guild.id)
        
        if (rrList.success) {
          description = rrList.configs.map((conf: any) => {
            return `\n**<Message ID -** [${conf.message_id}](https://pod.town/)\n` + conf.roles.map((role: any) => `+ Reaction ${role.reaction} for role <@&${role.id}>`).join("\n")
          })
        } else {
          description = "This server has no reaction role config"
        }
      }
    }

    return {
      embeds: [
        composeEmbedMessage(msg, {
          title: "Reaction Role",
          description
        })
      ]
    }
  }
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
    args.forEach(async val => {
      if (!val) return
    }) 
    const data = await executeAction(args, msg)
    
    return {
      messageOptions: data
    }
  },
  getHelpMessage: async (msg: Message) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: "Role Reaction",
        usage: `${PREFIX}rr <message_id> <emoji_id> <role_id> - To configure a reaction role\n${PREFIX}rr list - To list active reaction roles`,
        examples: `${PREFIX}rr 967107573591457832 ✅ 967013125847121973\n${PREFIX}rr list`
      })
    ]
  })
}

export default command
