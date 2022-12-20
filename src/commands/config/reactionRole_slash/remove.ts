import { RoleReactionEvent, SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage2, getErrorEmbed } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import config from "adapters/config"
import ChannelLogger from "utils/ChannelLogger"
import { BotBaseError, InternalError } from "errors"
import { logger } from "logger"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { isDiscordMessageLink } from "utils/common"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a reaction role configuration")
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
    const messageLink = interaction.options.getString("message_link", true)
    if (!isDiscordMessageLink(messageLink)) {
      throw new InternalError({
        message: interaction,
        description:
          "Invalid message link, use `$help rr` to learn how to get message link",
      })
    }

    const [guildId, channelId, messageId] = messageLink.split("/").slice(-3)
    if (guildId !== interaction.guildId) {
      throw new InternalError({
        message: interaction,
        description:
          "Guild ID invalid, please choose a message belongs to your guild",
      })
    }

    const channel = interaction.guild.channels.cache.get(channelId) // user already has message in the channel => channel in cache
    if (!channel || !channel.isText()) {
      throw new InternalError({
        message: interaction,
        description: "Channel not found",
      })
    }

    const message = await channel.messages.fetch(messageId).catch(() => null)
    if (!message) {
      throw new InternalError({
        message: interaction,
        description: "Message not found",
      })
    }

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
        message_id: message.id,
        reaction: "",
        role_id: "",
        channel_id: channel.id,
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
        message_id: message.id,
        reaction: emoji,
        role_id: roleId,
        channel_id: channel.id,
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
          throw new InternalError({
            message,
            title: "Unsuccessful",
            description: `You haven't set this reaction role yet. To set a new one, run \`\`\`${PREFIX}rr set <message_link> <emoji> <role>\`\`\`\n You can remove it later using \`${PREFIX}rr remove\`.`,
          })
        }
      } catch (error) {
        ChannelLogger.log(error as BotBaseError)
        throw new InternalError({
          message,
          title: "Unsuccessful",
          description: `You haven't set this reaction role yet. To set a new one, run \`\`\`${PREFIX}rr set <message_link> <emoji> <role>\`\`\`\n You can remove it later using \`${PREFIX}rr remove\`.`,
        })
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
        usage: `To remove a specific configuration in a message\n${PREFIX}reactionrole remove <message_link> <emoji> <role>\n\nTo clear all configurations in a message\n${PREFIX}reactionrole remove <message_link>`,
        examples: `${PREFIX}reactionrole remove https://discord.com/channels/...4875 ✅ @Visitor\n${PREFIX}reactionrole remove https://discord.com/channels/...4875`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
