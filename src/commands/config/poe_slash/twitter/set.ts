import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandArgumentError, GuildIdNotFoundError } from "errors"
import { handlePoeTwitterRemove } from "commands/config/poe/twitter/remove"
import { handlePoeTwitterSet } from "commands/config/poe/twitter/set"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Set a guild's Twitter PoE configurations.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription(
            "channel you want to receive tweets. Example: #general"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("keywords")
          .setDescription(
            "hashtags, mentions or account url. Example: #mochitag,@MochiBot"
          )
          .setRequired(true)
      )
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    const chan = interaction.options.getChannel("channel")
    const keywords = interaction.options.getString("keywords")
    if (!chan || !keywords) {
      throw new CommandArgumentError({
        message: interaction,
        getHelpMessage: () => command.help(interaction),
      })
    }

    return await handlePoeTwitterSet(
      interaction,
      interaction.guildId,
      chan.id,
      interaction.user.id,
      keywords
    )
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}poe twitter set <channel> <keywords>`,
        examples: `${SLASH_PREFIX}poe twitter set #general #mochitag,@MochiBot`,
        description: `\`<keywords>\` can be one of the following:\n\n1. \`#hashtag\`\n2. \`@twitter_username\`\n3. \`https://twitter.com/vincentz\`: same as (2) but in another way\n4. \`from:https://twitter.com/vincentz\`: watch every tweets from this user`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
