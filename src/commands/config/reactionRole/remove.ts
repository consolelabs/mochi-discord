import {
  Command,
  RoleReactionConfigResponse,
  RoleReactionEvent,
} from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message, TextChannel } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import ChannelLogger from "utils/ChannelLogger"
import { BotBaseError } from "errors"

const command: Command = {
  id: "reactionrole_remove",
  command: "remove",
  brief: "Remove a reaction role configuration",
  category: "Config",
  run: async (msg: Message) => {
    let description = ""
    const args = getCommandArguments(msg)

    // Validate command syntax
    if (![3, 5].includes(args.length)) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              usage: `To remove a specific configuration in a message\n${PREFIX}rr remove <message_id> <emoji> <role>\n\nTo clear all configurations in a message\n${PREFIX}rr remove <message_id>`,
              examples: `${PREFIX}rr remove 967107573591457832 ✅ @Visitor\n${PREFIX}rr remove 967107573591457832`,
            }),
          ],
        },
      }
    }

    let requestData: RoleReactionEvent

    switch (args.length) {
      case 5:
        requestData = {
          guild_id: msg.guild.id,
          message_id: args[2].replace(/\D/g, ""),
          reaction: args[3],
          role_id: args[4].replace(/\D/g, ""), // Accept number-only characters
        }
        break
    
      case 3:
        requestData = {
          guild_id: msg.guild.id,
          message_id: args[2].replace(/\D/g, ""),
          reaction: "",
          role_id: "",
        }
        break
    }

    try {
      const res: RoleReactionConfigResponse = await config.removeReactionConfig(
        requestData
      )

      if (res.success) {
        const channelList = msg.guild.channels.cache
          .filter((c) => c.type === "GUILD_TEXT")
          .map((c) => c as TextChannel)
        const { reaction, role_id } = requestData

        if (reaction && role_id) {
          description = `Reaction ${reaction} for this role <@&${role_id}> is now unset`

          let reactionEmoji: string
          const emojiSplit = reaction.split(":")
          reactionEmoji = emojiSplit.length === 1 ? reaction : reaction.replace(/\D/g, "")

          // Remove a specific reaction
          channelList.forEach((chan) =>
            chan.messages
              .fetch(requestData.message_id)
              .then((val) => val.reactions.cache.get(reactionEmoji).remove())
              .catch(err => err?.code === 10008 ? null : ChannelLogger.log(err as BotBaseError))
          )
        } else {
          description = `All reaction role configurations for this message is now clear.`

          // Remove all reaction from configured message
          channelList.forEach((chan) =>
            chan.messages
              .fetch(requestData.message_id)
              .then((val) => val.reactions.removeAll())
              .catch(err => err?.code === 10008 ? null : ChannelLogger.log(err as BotBaseError))
          )
        }
      } else {
        description = `Failed to remove this reaction role configuration.`
      }
    } catch (error) {
      ChannelLogger.log(error as BotBaseError)
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
          examples: `${PREFIX}rr remove 967107573591457832 ✅ @Visitor\n${PREFIX}rr remove 967107573591457832`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
}

export default command
