import { RoleReactionEvent, SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import config from "adapters/config"
import { APIError, CommandError } from "errors"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { isDiscordMessageLink } from "utils/common"
import { parseDiscordToken } from "utils/commands"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Set a new reaction role configuration")
      .addStringOption((option) =>
        option
          .setName("message_link")
          .setDescription(
            "link of message which you want to configure for role"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("emoji")
          .setDescription("emoji which you want to configure for role")
          .setRequired(true)
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("role which you want to configure")
          .setRequired(true)
      )
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId || !interaction.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "This command must be run in a guild",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    // Validate input reaction emoji
    const emojiArg = interaction.options.getString("emoji", true)
    const {
      isEmoji,
      isNativeEmoji,
      isAnimatedEmoji,
      value: reaction,
    } = parseDiscordToken(emojiArg)
    if (!isEmoji && !isNativeEmoji && !isAnimatedEmoji) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: `Emoji ${emojiArg} is invalid or not owned by this guild. Pick another emoji! 💪`,
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    // Validate message link https://discord.com/channels/guild_id/chan_id/msg_id
    const messageLink = interaction.options.getString("message_link", true)
    if (!isDiscordMessageLink(messageLink)) {
      throw new CommandError({
        user: interaction.user,
        guild: interaction.guild,
        description:
          "Can't find the messages.\n\n👉 _Click “More” on your messages then choose “Copy Message Link”._\n👉 _Or go [here](https://mochibot.gitbook.io/mochi-bot/functions/server-administration/reaction-roles) for instructions._",
      })
    }

    const [guildId, channelId, messageId] = messageLink.split("/").slice(-3)
    if (guildId !== interaction.guildId) {
      throw new CommandError({
        user: interaction.user,
        guild: interaction.guild,
        description:
          "Guild ID invalid, please choose a message belongs to your guild.\n\n👉 _Click “More” on your messages then choose “Copy Message Link”._\n👉 _Or go [here](https://mochibot.gitbook.io/mochi-bot/functions/server-administration/reaction-roles) for instructions._",
      })
    }

    const channel = interaction.guild.channels.cache.get(channelId) // user already has message in the channel => channel in cache
    if (!channel || !channel.isText()) {
      throw new CommandError({
        user: interaction.user,
        guild: interaction.guild,
        description:
          "Channel invalid, please choose a message in a text channel.\n\n👉 _Click “More” on your messages then choose “Copy Message Link”._\n👉 _Or go [here](https://mochibot.gitbook.io/mochi-bot/functions/server-administration/reaction-roles) for instructions._",
      })
    }

    const reactMessage = await channel.messages
      .fetch(messageId)
      .catch(() => null)
    if (!reactMessage) {
      throw new CommandError({
        user: interaction.user,
        guild: interaction.guild,
        description:
          "Message not found, please choose another valid message. \n\n👉 _Click “More” on your messages then choose “Copy Message Link”._\n👉 _Or go [here](https://mochibot.gitbook.io/mochi-bot/functions/server-administration/reaction-roles) for instructions._",
      })
    }

    const role = interaction.options.getRole("role", true)
    const requestData: RoleReactionEvent = {
      guild_id: interaction.guild.id,
      message_id: reactMessage.id,
      reaction,
      role_id: role.id,
      channel_id: channel.id,
    }

    const res = await config.updateReactionConfig(requestData)
    if (!res.ok) {
      throw new APIError({
        user: interaction.user,
        guild: interaction.guild,
        curl: res.curl,
        description:
          "Failed to set reaction role. \n\n👉 _Click “More” on your messages then choose “Copy Message Link”._\n👉 _Or go [here](https://mochibot.gitbook.io/mochi-bot/functions/server-administration/reaction-roles) for instructions._",
      })
    }
    await reactMessage.react(requestData.reaction)
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Reaction role set!",
            description: `Emoji ${requestData.reaction} is now set to this role <@&${requestData.role_id}>`,
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        description:
          "Don't know where to get the message link?\n👉 _Click “More” on your messages then choose “Copy Message Link”._\n👉 _Or go [here](https://mochibot.gitbook.io/mochi-bot/functions/server-administration/reaction-roles) for instructions._",
        usage: `${PREFIX}rr set <message_link> <emoji> <role>`,
        examples: `${PREFIX}reactionrole set https://discord.com/channels/...4875 ✅ @Visitor`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
