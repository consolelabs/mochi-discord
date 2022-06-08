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
  id: "reactionrole_add",
  command: "add",
  brief: "Add a new reaction role configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    let description = ""
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

    let reaction = args[3]
    if (reaction.startsWith("<:") && reaction.endsWith(">")) {
      reaction = reaction.toLowerCase()
    }

    const role_id = args[4].replace(/\D/g, "") // Accept number-only characters
    const requestData: RoleReactionEvent = {
      guild_id: msg.guild.id,
      message_id: args[2].replace(/\D/g, ""),
      reaction,
      role_id,
    }

    // Validate input reaction emoji
    let isValidEmoji = false;
    const emojiSplit = requestData.reaction.split(":")
    if (emojiSplit.length === 1) { isValidEmoji = true }
    msg.guild.emojis.cache.forEach(e => {
      if (emojiSplit.includes(e.name.toLowerCase())) {
        isValidEmoji = true
      }
    })

    if (!isValidEmoji) {
      description = `Emoji ${requestData.reaction} is not owned by this server. Please use another one.`
    } else {
      try {
        const channelList = msg.guild.channels.cache
          .filter((c) => c.type === "GUILD_TEXT")
          .map((c) => c as TextChannel)
        const rrConfig: RoleReactionConfigResponse =
          await config.updateReactionConfig(requestData)

        if (rrConfig.success) {
          description = `${requestData.reaction} is now setting to this role <@&${requestData.role_id}>`
          
          channelList.forEach((chan) =>
            chan.messages
              .fetch(requestData.message_id)
              .then((val) => val.react(requestData.reaction))
              .catch(err => err?.code === 10008 ? null : ChannelLogger.log(err as BotBaseError))
          )
        }
      } catch (error) {
        ChannelLogger.log(error as BotBaseError)
        description = `${requestData.reaction} has already been configured, please try to set another one`
      }
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
          usage: `${PREFIX}rr add <message_id> <emoji> <role>`,
          examples: `${PREFIX}rr add 967107573591457832 ✅ @Visitor`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
}

export default command
