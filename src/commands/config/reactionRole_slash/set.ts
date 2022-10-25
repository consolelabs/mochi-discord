import { RoleReactionEvent, SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage2, getErrorEmbed } from "utils/discordEmbed"
import { CommandInteraction, Message, TextChannel } from "discord.js"
import config from "adapters/config"
import ChannelLogger from "utils/ChannelLogger"
import { BotBaseError } from "errors"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Set a new reaction role configuration")
      .addStringOption((option) =>
        option
          .setName("message_id")
          .setDescription("message which you want to configure for role")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("emoji")
          .setDescription("emoji which you want to configure for role")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("role")
          .setDescription("role which you want to configure")
          .setRequired(true)
      )
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guild) {
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
    let reaction = interaction.options.getString("emoji", true)
    let isValidEmoji = false
    if (reaction.startsWith("<:") && reaction.endsWith(">")) {
      reaction = reaction.toLowerCase()
    }
    const emojiSplit = reaction.split(":")
    if (emojiSplit.length === 1) {
      isValidEmoji = true
    }
    if (emojiSplit.length === 3) {
      isValidEmoji = true
      const emojiId = emojiSplit[2].replace(/\D/g, "")
      await interaction.guild.emojis.fetch(emojiId).catch(() => {
        isValidEmoji = false
      })
    }
    if (!isValidEmoji) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: `Emoji ${reaction} is invalid or not owned by this guild`,
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    // Validate ROLE_ID args
    const roleId = interaction.options
      .getString("role", true)
      .replace(/\D/g, "") // Accept number-only characters
    const role = await interaction.guild.roles.fetch(roleId)
    if (!role || !roleId) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ description: "Role not found" })],
          originalMsgAuthor: interaction.user,
        },
      }
    }

    // Validate message_id
    const messageId = interaction.options
      .getString("message_id", true)
      .replace(/\D/g, "")
    const channelList = interaction.guild.channels.cache
      .filter((c) => c.type === "GUILD_TEXT")
      .map((c) => c as TextChannel)

    const message = (
      await Promise.all(
        channelList.map((chan) =>
          chan.messages.fetch(messageId).catch(() => null)
        )
      )
    ).find((m) => m instanceof Message)

    if (!message || !messageId) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ description: "Message not found" })],
          originalMsgAuthor: interaction.user,
        },
      }
    }

    const requestData: RoleReactionEvent = {
      guild_id: interaction.guild.id,
      message_id: messageId,
      reaction,
      role_id: roleId,
    }

    const res = await config.updateReactionConfig(requestData)
    if (res.ok) {
      message.react(requestData.reaction)
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage2(interaction, {
              author: ["Reaction roles", interaction.guild.iconURL()],
              description: `Emoji ${requestData.reaction} is now setting to this role <@&${requestData.role_id}>`,
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    if (res.error) {
      ChannelLogger.alertSlash(
        interaction,
        new Error(res.error) as BotBaseError
      )
    }

    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description:
              "Role / emoji was configured, please type `/reactionrole list` to check.",
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}reactionrole set <message_id> <emoji> <role>`,
        examples: `${PREFIX}reactionrole set 967107573591457832 ✅ @Visitor\n${PREFIX}reactionrole set 1018789986058895400 ✅ @admin`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
