import {
  Command,
  RoleReactionConfigResponse,
  RoleReactionEvent,
} from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
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
  onlyAdministrator: true,
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

    // Validate message_id
    const messageId = args[2].replace(/\D/g, "")
    let message: Message

    const channelList = msg.guild.channels.cache
      .filter((c) => c.type === "GUILD_TEXT")
      .map((c) => c as TextChannel)

    await Promise.all(
      channelList.map((chan) =>
        chan.messages
          .fetch(messageId)
          .then((data) => {
            message = data
          })
          .catch(() => null)
      )
    )

    if (!message || !messageId) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Message not found" })],
        },
      }
    }

    let requestData: RoleReactionEvent
    switch (args.length) {
      // Remove a specific reaction
      case 5: {
        const roleId = args[4].replace(/\D/g, "")
        const role = await msg.guild.roles.fetch(roleId)
        if (!role || !roleId) {
          return {
            messageOptions: {
              embeds: [getErrorEmbed({ msg, description: "Role not found" })],
            },
          }
        }
        requestData = {
          guild_id: msg.guild.id,
          message_id: messageId,
          reaction: args[3],
          role_id: roleId,
        }
        break
      }
      // Remove all reaction from configured message
      case 3:
        requestData = {
          guild_id: msg.guild.id,
          message_id: messageId,
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
        const { reaction, role_id } = requestData
        if (reaction && role_id) {
          description = `Reaction ${reaction} for this role <@&${role_id}> is now unset`

          const emojiSplit = reaction.split(":")
          const reactionEmoji =
            emojiSplit.length === 1 ? reaction : reaction.replace(/\D/g, "")
          message.reactions.cache.get(reactionEmoji).remove().catch()
        } else {
          description = `All reaction role configurations for this message is now clear.`
          message.reactions.removeAll().catch()
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
  colorType: "Server",
}

export default command
