import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"

const command: SlashCommand = {
  name: "quest",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("quest")
      .setDescription("view quests")
      .addStringOption((opt) =>
        opt
          .setName("time")
          .setDescription("filter quests by time")
          .setChoices([
            ["daily", "daily"],
            ["weekly", "weekly"],
            ["one time", "one time"],
          ])
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const time = interaction.options.getString("time", false)

    return {
      messageOptions: {
        content: "quest " + time,
      },
    }
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          description: "Check on your quests and what rewards you can claim",
          usage: `${SLASH_PREFIX}earn quest`,
          examples: `${SLASH_PREFIX}earn quest`,
          footer: [`Type ${SLASH_PREFIX}help earn`],
        }),
      ],
    }),
  colorType: "Server",
}

export default command
