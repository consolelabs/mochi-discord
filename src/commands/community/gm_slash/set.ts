import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { InternalError, GuildIdNotFoundError } from "errors"
import { handle } from "../gm/config"
import { composeEmbedMessage2 } from "utils/discordEmbed"
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
      .addStringOption((option) =>
        option
          .setName("msg")
          .setDescription("the msg which you wanna set as gm. Example: gm")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("emoji")
          .setDescription("the emoji which you wanna set as gm. Example: 🎲")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId || !interaction.guild) {
      throw new GuildIdNotFoundError({})
    }
    const chanArg = interaction.options.getChannel("channel")
    if (!chanArg) {
      throw new InternalError({
        message: interaction,
        description: "Invalid channel, please choose a text channel.",
      })
    }

    const chan = await interaction.guild.channels
      .fetch(chanArg?.id ?? "")
      .catch(() => undefined)
    if (!chan || !chan.isText()) {
      throw new InternalError({
        message: interaction,
        description: "Invalid channel, please choose a text channel.",
      })
    }

    return await handle(
      interaction.guildId,
      chan.id,
      interaction.options.getString("msg", true),
      interaction.options.getString("emoji", true),
      // TODO(trkhoi): find way to set sticker with slash command
      ""
    )
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
