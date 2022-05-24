import {
  Command,
  RoleReactionConfigResponse,
  RoleReactionEvent,
} from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"

const command: Command = {
  id: "reactionrole_remove",
  command: "remove",
  brief: "Remove a reaction role configuration",
  category: "Config",
  run: async (msg: Message) => {
    let description = ""
    const args = getCommandArguments(msg)
    if (args.length < 3) {
      return
    }

    let requestData: RoleReactionEvent

    if (args.length >= 5) {
      requestData = {
        guild_id: msg.guild.id,
        message_id: args[2].replace(/\D/g, ""),
        reaction: args[3],
        role_id: args[4].replace(/\D/g, ""), // Accept number-only characters
      }
    } else {
      requestData = {
        guild_id: msg.guild.id,
        message_id: args[2].replace(/\D/g, ""),
        reaction: "",
        role_id: "",
      }
    }

    const res: RoleReactionConfigResponse = await config.removeReactionConfig(
      requestData
    )

    if (res.success) {
      const { reaction, role_id } = requestData
      if (reaction && role_id) {
        description = `Reaction ${requestData.reaction} for this role <@&${requestData.role_id}> is now unset`

        // Remove a specific reaction
        msg.channel.messages
          .fetch(requestData.message_id)
          .then((val) => val.reactions.cache.get(reaction).remove())
      } else {
        description = `All reaction role configurations for this message is now clear.`

        // Remove all previous reactions
        msg.channel.messages
          .fetch(requestData.message_id)
          .then((val) => val.reactions.removeAll())
      }
    } else {
      description = `Failed to remove this reaction role configuration.`
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Reaction Roles",
            description,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `To remove a specific configuration in a message\n${PREFIX}rr remove <message_id> <emoji> <role>\n\nTo clear all configurations in a message\n${PREFIX}rr remove <message_id>`,
          examples: `${PREFIX}rr remove 967107573591457832 @Visitor\n${PREFIX}rr remove 967107573591457832`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
}

export default command
