import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runCreateChannel } from "./processor"

const command: SlashCommand = {
  name: "channel",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("channel")
      .setDescription("enter channel")
      .addChannelOption((option) =>
        option.setName("channel").setDescription("enter channel"),
      )
  },
  run: async function (interaction: CommandInteraction) {
    return runCreateChannel({
      i: interaction,
      guildId: interaction.guildId ?? undefined,
    })
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}vault config channel <channel>`,
        examples: `${SLASH_PREFIX}vault config channel #general`,
        document: `${GM_GITBOOK}&action=streak`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
