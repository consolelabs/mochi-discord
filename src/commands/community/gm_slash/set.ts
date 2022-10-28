import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandError, GuildIdNotFoundError } from "errors"
import { handle } from "../gm/config"
import { composeEmbedMessage2, getErrorEmbed } from "utils/discordEmbed"
import { SlashCommand } from "types/common"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"

const command: SlashCommand = {
  name: "set",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Create gm channel")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription(
            "the channel which you wanna set as gm. Example: #general"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId || !interaction.guild) {
      throw new GuildIdNotFoundError({})
    }
    if (!interaction.memberPermissions?.has("ADMINISTRATOR", true)) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Insufficient permissions",
              description: `Only Administrators of this server can run this command.`,
            }),
          ],
        },
      }
    }
    const chanArg = interaction.options.getChannel("channel")
    if (!chanArg) {
      throw new CommandError({
        description: "Invalid channel, please choose a text channel.",
      })
    }

    const chan = await interaction.guild.channels
      .fetch(chanArg?.id ?? "")
      .catch(() => undefined)
    if (!chan || !chan.isText()) {
      throw new CommandError({
        description: "Invalid channel, please choose a text channel.",
      })
    }

    return await handle(interaction.guildId, chan.id)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}gm config <channel>`,
        examples: `${SLASH_PREFIX}gm config #general`,
        document: `${GM_GITBOOK}&action=config`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
