import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runAddTreasurer } from "./processor"

const command: SlashCommand = {
  name: "add",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("add")
      .setDescription("Add treasurer to vault")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("enter a vault name")
          .setRequired(true)
      )
      .addUserOption((option) =>
        option.setName("user").setDescription("enter a user").setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("enter a message for user")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    return runAddTreasurer({
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
