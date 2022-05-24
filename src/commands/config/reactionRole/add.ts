import {
  Command,
  RoleReactionConfigResponse,
  RoleReactionEvent
} from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"

const command: Command = {
  id: "reactionrole_add",
  command: "add",
  brief: "Add a new reaction role configuration",
  category: "Config",
  run: async (msg: Message) => {
    let description = ""
    const args = getCommandArguments(msg)
    if (args.length < 5) {
      return
    }
    let reaction = args[3]
    if (reaction.startsWith("<:") && reaction.endsWith(">")) {
      reaction = reaction.toLowerCase()
    }
    const role_id = args[4].replace(/\D/g, "") // Accept number-only characters
    const requestData: RoleReactionEvent = {
      guild_id: msg.guild.id,
      message_id: args[2].replace(/\D/g, ""),
      reaction,
      role_id
    }
    const rrConfig: RoleReactionConfigResponse = await config.updateReactionConfig(
      requestData
    )
    if (rrConfig.success) {
      description = `${requestData.reaction} is now setting to this role <@&${requestData.role_id}>`
      msg.channel.messages
        .fetch(requestData.message_id)
        .then(val => val.react(requestData.reaction))
    } else {
      description = `${requestData.reaction} has already been configured, please try to set another one`
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Reaction Roles",
            description
          })
        ]
      }
    }
  },
  getHelpMessage: async msg => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}rr add <message_id> <emoji> <role>`,
          examples: `${PREFIX}rr add 967107573591457832 ✅ @Visitor`
        })
      ]
    }
  },
  canRunWithoutAction: true
}

export default command
