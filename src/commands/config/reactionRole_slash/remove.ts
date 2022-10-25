import { RoleReactionEvent, SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage2, getErrorEmbed } from "utils/discordEmbed"
import { CommandInteraction, Message, TextChannel } from "discord.js"
import config from "adapters/config"
import ChannelLogger from "utils/ChannelLogger"
import { BotBaseError } from "errors"
import { logger } from "logger"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a reaction role configuration")
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
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("role")
          .setDescription("role which you want to configure")
          .setRequired(false)
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
    let description = ""

    // Validate command syntax
    const role = interaction.options.getString("role", false)
    const emoji = interaction.options.getString("emoji", false)
    if ((role == null) != (emoji == null)) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage2(interaction, {
              usage: `To remove a specific configuration in a message\n${PREFIX}reactionrole remove <message_id> <emoji> <role>\n\nTo clear all configurations in a message\n${PREFIX}reactionrole remove <message_id>`,
              examples: `${PREFIX}reactionrole remove 967107573591457832 ✅ @Visitor\n${PREFIX}reactionrole remove 967107573591457832`,
            }),
          ],
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
          embeds: [
            getErrorEmbed({
              description: "Message not found",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    let requestData: RoleReactionEvent | null = null
    if (!emoji && !role) {
      // Remove all reaction from configured message
      requestData = {
        guild_id: interaction.guild.id,
        message_id: messageId,
        reaction: "",
        role_id: "",
      }
    } else if (emoji && role) {
      // Remove a specific reaction
      const roleId = role.replace(/\D/g, "")
      const guildRole = await interaction.guild.roles.fetch(roleId)
      if (!guildRole || !roleId) {
        return {
          messageOptions: {
            embeds: [
              getErrorEmbed({
                description: "Role not found",
                originalMsgAuthor: interaction.user,
              }),
            ],
          },
        }
      }
      requestData = {
        guild_id: interaction.guild.id,
        message_id: messageId,
        reaction: emoji,
        role_id: roleId,
      }
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
          description = `Failed to remove this reaction role configuration.`
        }
      } catch (error) {
        ChannelLogger.log(error as BotBaseError)
        description = `Failed to remove this reaction role configuration.`
      }
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage2(interaction, {
            author: ["Reaction roles", interaction.guild.iconURL()],
            description,
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `To remove a specific configuration in a message\n${PREFIX}reactionrole remove <message_id> <emoji> <role>\n\nTo clear all configurations in a message\n${PREFIX}reactionrole remove <message_id>`,
        examples: `${PREFIX}reactionrole remove 967107573591457832 ✅ @Visitor\n${PREFIX}reactionrole remove 967107573591457832`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
