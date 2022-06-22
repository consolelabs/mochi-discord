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
  id: "reactionrole_add",
  command: "add",
  brief: "Add a new reaction role configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    const args = getCommandArguments(msg)

    if (args.length !== 5) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              usage: `${PREFIX}rr add <message_id> <emoji> <role>`,
              examples: `${PREFIX}rr add 967107573591457832 ✅ @Visitor`,
            }),
          ],
        },
      }
    }

    // Validate input reaction emoji
    let reaction = args[3]
    let isValidEmoji = false
    if (reaction.startsWith("<:") && reaction.endsWith(">")) {
      reaction = reaction.toLowerCase()
    }
    const emojiSplit = reaction.split(":")
    if (emojiSplit.length === 1) {
      isValidEmoji = true
    }
    msg.guild.emojis.cache.forEach((e) => {
      if (emojiSplit.includes(e.name.toLowerCase())) {
        isValidEmoji = true
      }
    })
    if (!isValidEmoji) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: `Emoji ${reaction} is invalid or not owned by this guild`,
            }),
          ],
        },
      }
    }

    // Validate ROLE_ID args
    const roleId = args[4].replace(/\D/g, "") // Accept number-only characters
    const role = await msg.guild.roles.fetch(roleId)
    if (!role || !roleId) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Role not found" })],
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

    try {
      const requestData: RoleReactionEvent = {
        guild_id: msg.guild.id,
        message_id: messageId,
        reaction,
        role_id: roleId,
      }

      const rrConfig: RoleReactionConfigResponse =
        await config.updateReactionConfig(requestData)
      if (rrConfig.success) {
        message.react(requestData.reaction)
        return {
          messageOptions: {
            embeds: [
              composeEmbedMessage(msg, {
                title: "Reaction Roles",
                description: `${requestData.reaction} is now setting to this role <@&${requestData.role_id}>`,
              }),
            ],
          },
        }
      }
    } catch (error) {
      ChannelLogger.log(error as BotBaseError)
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description:
                "Role / emoji was configured, please type `$rr list` to check & try again.",
            }),
          ],
        },
      }
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}rr add <message_id> <emoji> <role>`,
          examples: `${PREFIX}rr add 967107573591457832 ✅ @Visitor`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
