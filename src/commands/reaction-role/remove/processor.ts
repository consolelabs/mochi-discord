import { CommandInteraction, Message } from "discord.js"
import config from "adapters/config"
import { GuildIdNotFoundError, InternalError } from "errors"
import { logger } from "ethers"
import { RoleReactionEvent } from "types/config"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  isDiscordMessageLink,
  emojis,
  getEmojiURL,
  msgColors,
  getEmoji,
} from "utils/common"
import { PREFIX } from "utils/constants"

export const handleRoleRemove = async (
  args: string[],
  msg: Message | CommandInteraction
) => {
  // Validate command syntax
  if (![3, 5].includes(args.length)) {
    return {
      embeds: [
        composeEmbedMessage(null, {
          usage: `To remove a specific configuration in a message\n${PREFIX}rr remove <message_link> <emoji> <role>\n\nTo clear all configurations in a message\n${PREFIX}rr remove <message_link>`,
          examples: `${PREFIX}rr remove 967107573591457832 ✅ @Visitor\n${PREFIX}rr remove 967107573591457832`,
        }),
      ],
    }
  }

  const { message, guild, requestData } = await parseRequestArguments(args, msg)
  if (!message || !message.id) {
    return {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Command error", getEmojiURL(emojis["REVOKE"])],
          description: "Message not found",
          color: msgColors.ERROR,
        }),
      ],
    }
  }

  let description = ""
  const res = await config.removeReactionConfig(requestData)
  if (!res.ok) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: "Unsuccessful",
      description: `You haven't set this reaction role yet. To set a new one, run \`\`\`${PREFIX}rr set <message_link> <emoji> <role>\`\`\`\n You can remove it later using \`${PREFIX}rr remove\`.`,
    })
  }

  const { reaction, role_id } = requestData
  if (reaction && role_id) {
    description = `Reaction ${reaction} is removed for <@&${role_id}>.`
    const emojiSplit = reaction.split(":")
    const reactionEmoji =
      emojiSplit.length === 1 ? reaction : reaction.replace(/\D/g, "")
    const msgReaction = message.reactions.cache.get(reactionEmoji)
    if (msgReaction) {
      await msgReaction.remove().catch((e) => {
        logger.info(e)
      })
    }
  } else {
    description = `All reaction role configurations for this message is now clear.`
    message.reactions.removeAll().catch((e) => {
      logger.info(e)
    })
  }

  return {
    embeds: [
      composeEmbedMessage(null, {
        author: ["Reaction roles", guild.iconURL()],
        description,
      }),
    ],
  }
}

export const parseRequestArguments = async (
  args: string[],
  msg: Message | CommandInteraction
) => {
  if (!msg.guildId || !msg.guild) {
    throw new GuildIdNotFoundError({ message: msg })
  }

  // Validate message_link
  if (!isDiscordMessageLink(args[2])) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: "Invalid message link",
      description: `Your message link is invalid. Make sure that message exists, or that you have entered the link correctly.\n\n${getEmoji(
        "POINTINGRIGHT"
      )} _Click “More” on your messages then choose “Copy Message Link”._\n${getEmoji(
        "POINTINGRIGHT"
      )} Or go [here](https://mochibot.gitbook.io/mochi-bot/functions/server-administration/reaction-roles) for instructions.`,
    })
  }

  const [guildId, channelId, messageId] = args[2].split("/").slice(-3)
  if (guildId !== msg.guildId) {
    throw new InternalError({
      msgOrInteraction: msg,
      description:
        "Guild ID invalid, please choose a message belongs to your guild",
    })
  }

  const channel = msg.guild.channels.cache.get(channelId) // user already has message in the channel => channel in cache
  if (!channel || !channel.isText()) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: "Channel not found",
    })
  }

  const message = await channel.messages.fetch(messageId).catch(() => null)
  if (!message) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: "Message not found",
    })
  }

  enum ParseType {
    Total = 3,
    Specific = 5,
  }
  const parseMap = new Map()
  parseMap.set(ParseType.Specific, async () => {
    const roleId = args[4].replace(/\D/g, "")
    const role = await msg?.guild?.roles.fetch(roleId)
    if (!role || !roleId) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Can't find the role",
        description: `Invalid role. Be careful not to be mistaken role with username while using \`@\`.\n${getEmoji(
          "POINTINGRIGHT"
        )} Run \`$rr list\` to find a configured role then Click “Jump” to jump to the message.`,
      })
    }
    return {
      guild_id: msg?.guild?.id,
      message_id: message.id,
      reaction: args[3],
      role_id: roleId,
      channel_id: channel.id,
    }
  })
  parseMap.set(ParseType.Total, async () => {
    return Promise.resolve({
      guild_id: msg?.guild?.id,
      message_id: message.id,
      reaction: "",
      role_id: "",
      channel_id: "",
    })
  })

  const parseFunc: () => Promise<RoleReactionEvent> = parseMap.get(args.length)
  if (!parseFunc) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: "Message not found",
    })
  }

  const requestData = await parseFunc()
  return {
    message,
    guild: msg.guild,
    requestData,
  }
}
