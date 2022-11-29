import { Command, RoleReactionEvent } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { APIError, InternalError, GuildIdNotFoundError } from "errors"
import { isDiscordMessageLink } from "utils/common"
import { throwOnInvalidEmoji } from "utils/emoji"

const troubleshootMsg = `\n\n👉 _Click “More” on your messages then choose “Copy Message Link”._\n👉 _Or go [here](https://mochibot.gitbook.io/mochi-bot/functions/server-administration/reaction-roles) for instructions._`

const command: Command = {
  id: "reactionrole_set",
  command: "set",
  brief: "Set up a new reaction role.",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)

    // Validate message link https://discord.com/channels/guild_id/chan_id/msg_id
    if (!isDiscordMessageLink(args[2])) {
      throw new InternalError({
        message: msg,
        description: `Can't find the messages.${troubleshootMsg}`,
      })
    }

    // Validate input reaction emoji
    const reaction = args[3]
    throwOnInvalidEmoji(reaction, msg)

    // Validate role id args
    const { isRole, value: roleId } = parseDiscordToken(args[4])
    if (!isRole || !roleId) {
      throw new InternalError({
        title: "Can't find the role",
        description: "Be careful not to mix up role and username 😬",
      })
    }

    const [guildId, channelId, messageId] = args[2].split("/").slice(-3)
    if (guildId !== msg.guildId) {
      throw new InternalError({
        message: msg,
        description: `Guild ID invalid, please choose a message belongs to your guild.${troubleshootMsg}`,
      })
    }

    const channel = msg.guild.channels.cache.get(channelId) // user already has message in the channel => channel in cache
    if (!channel || !channel.isText()) {
      throw new InternalError({
        message: msg,
        description: `Channel invalid, please choose a message in a text channel.${troubleshootMsg}`,
      })
    }

    const reactMessage = await channel.messages
      .fetch(messageId)
      .catch(() => null)
    if (!reactMessage) {
      throw new InternalError({
        message: msg,
        description: `Message not found, please choose another valid message.${troubleshootMsg}`,
      })
    }

    const requestData: RoleReactionEvent = {
      guild_id: msg.guild.id,
      message_id: reactMessage.id,
      reaction,
      role_id: roleId,
      channel_id: channel.id,
    }

    const res = await config.updateReactionConfig(requestData)
    if (!res.ok) {
      throw new APIError({
        message: msg,
        curl: res.curl,
        description: res.log,
        error: `Failed to set reaction role.${troubleshootMsg}`,
      })
    }

    await reactMessage.react(requestData.reaction).catch(() => null)

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Reaction role set!",
            description: `Emoji ${requestData.reaction} is now set to this role <@&${requestData.role_id}>`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          description: `Don't know where to get the message link?${troubleshootMsg}\n\n*Note:\n👉 Please use the **custom emoji from this server** and the **Discord default emoji**.*`,
          usage: `${PREFIX}rr set <message_link> <emoji> <role>`,
          examples: `${PREFIX}reactionrole set https://discord.com/channels/...4875 ✅ @Visitor`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 5,
}

export default command
