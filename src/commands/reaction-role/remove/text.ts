import { Command, RoleReactionEvent } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "discord/embed/ui"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import ChannelLogger from "logger/channel"
import { BotBaseError, InternalError, GuildIdNotFoundError } from "errors"
import { logger } from "logger"
import { defaultEmojis, isDiscordMessageLink } from "utils/common"

const command: Command = {
  id: "reactionrole_remove",
  command: "remove",
  brief: "Remove a reaction role configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guildId || !msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    let description = ""
    const args = getCommandArguments(msg)

    // Validate command syntax
    if (![3, 5].includes(args.length)) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              usage: `To remove a specific configuration in a message\n${PREFIX}rr remove <message_link> <emoji> <role>\n\nTo clear all configurations in a message\n${PREFIX}rr remove <message_link>`,
              examples: `${PREFIX}rr remove 967107573591457832 ✅ @Visitor\n${PREFIX}rr remove 967107573591457832`,
            }),
          ],
        },
      }
    }

    // Validate message_link
    if (!isDiscordMessageLink(args[2])) {
      throw new InternalError({
        message: msg,
        title: "Invalid message link",
        description: `Your message link is invalid. Make sure that message exists, or that you have entered the link correctly.\n\n👉 _Click “More” on your messages then choose “Copy Message Link”._\n👉 Or go [here](https://mochibot.gitbook.io/mochi-bot/functions/server-administration/reaction-roles) for instructions.`,
      })
    }

    const [guildId, channelId, messageId] = args[2].split("/").slice(-3)
    if (guildId !== msg.guildId) {
      throw new InternalError({
        message: msg,
        description:
          "Guild ID invalid, please choose a message belongs to your guild",
      })
    }

    const channel = msg.guild.channels.cache.get(channelId) // user already has message in the channel => channel in cache
    if (!channel || !channel.isText()) {
      throw new InternalError({
        message: msg,
        description: "Channel not found",
      })
    }

    const message = await channel.messages.fetch(messageId).catch(() => null)
    if (!message) {
      throw new InternalError({
        message: msg,
        description: "Message not found",
      })
    }

    if (!message || !message.id) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Message not found" })],
        },
      }
    }

    let requestData: RoleReactionEvent | null = null
    switch (args.length) {
      // Remove a specific reaction
      case 5: {
        const roleId = args[4].replace(/\D/g, "")
        const role = await msg.guild.roles.fetch(roleId)
        if (!role || !roleId) {
          throw new InternalError({
            message: msg,
            title: "Can't find the role",
            description: `Invalid role. Be careful not to be mistaken role with username while using \`@\`.\n${defaultEmojis.POINT_RIGHT} Run \`$rr list\` to find a configured role then Click “Jump” to jump to the message.`,
          })
        }
        requestData = {
          guild_id: msg.guild.id,
          message_id: message.id,
          reaction: args[3],
          role_id: roleId,
          channel_id: channel.id,
        }
        break
      }
      // Remove all reaction from configured message
      case 3:
        requestData = {
          guild_id: msg.guild.id,
          message_id: message.id,
          reaction: "",
          role_id: "",
          channel_id: "",
        }
        break
    }

    if (requestData) {
      try {
        const res = await config.removeReactionConfig(requestData)
        if (res.ok) {
          const { reaction, role_id } = requestData
          if (reaction && role_id) {
            description = `Reaction ${reaction} is removed for <@&${role_id}>.`

            const emojiSplit = reaction.split(":")
            const reactionEmoji =
              emojiSplit.length === 1 ? reaction : reaction.replace(/\D/g, "")
            message.reactions.cache
              .get(reactionEmoji)
              ?.remove()
              .catch((e) => {
                logger.info(e)
              })
          } else {
            description = `All reaction role configurations for this message is now clear.`
            message.reactions.removeAll().catch((e) => {
              logger.info(e)
            })
          }
        } else {
          throw new InternalError({
            message: msg,
            title: "Unsuccessful",
            description: `You haven't set this reaction role yet. To set a new one, run \`\`\`${PREFIX}rr set <message_link> <emoji> <role>\`\`\`\n You can remove it later using \`${PREFIX}rr remove\`.`,
          })
        }
      } catch (error) {
        ChannelLogger.log(error as BotBaseError)
        throw new InternalError({
          message: msg,
          title: "Unsuccessful",
          description: `You haven't set this reaction role yet. To set a new one, run \`\`\`${PREFIX}rr set <message_link> <emoji> <role>\`\`\`\n You can remove it later using \`${PREFIX}rr remove\`.`,
        })
      }
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: ["Reaction roles", msg.guild.iconURL()],
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
          usage: `To remove a specific configuration in a message\n${PREFIX}rr remove <message_link> <emoji> <role>\n\nTo clear all configurations in a message\n${PREFIX}rr remove <message_link>`,
          examples: `${PREFIX}rr remove https://discord.com/channels/...4875 ✅ @Visitor\n${PREFIX}rr remove https://discord.com/channels/...4875`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 3,
}

export default command
