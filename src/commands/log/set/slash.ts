import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import config from "adapters/config"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription(
        "Set logging channel to monitor guild members' activities"
      )
      .addStringOption((option) =>
        option
          .setName("channel")
          .setDescription(
            "the channel which you wanna log members' activities. Example: #general"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "This command must be run in a Guild",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    const channelArg = interaction.options.getString("channel")
    if (
      !channelArg ||
      !channelArg.startsWith("<#") ||
      !channelArg.endsWith(">")
    ) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "Invalid channel. Please choose another one!",
            }),
          ],
        },
      }
    }

    const logChannel = channelArg.substring(2, channelArg.length - 1)
    const chan = await interaction.guild.channels
      .fetch(logChannel)
      .catch(() => undefined)
    if (!chan)
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "Channel not found",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }

    await config.updateGuild({ guildId: interaction.guild.id, logChannel })
    const embed = getSuccessEmbed({
      title: interaction.guild.name,
      description: `Successfully set <#${logChannel}> as log channel`,
      originalMsgAuthor: interaction.user,
    })
    return { messageOptions: { embeds: [embed] } }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}gm streak`,
        examples: `${SLASH_PREFIX}gm streak`,
        document: `${GM_GITBOOK}&action=streak`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
