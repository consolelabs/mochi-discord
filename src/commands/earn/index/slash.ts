import { CommandInteraction } from "discord.js"
import {
  buildHelpInterface,
  defaultPageType,
  getHelpEmbed,
  pagination,
} from "./processor"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"

const slashCmd: SlashCommand = {
  name: "earn",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("earn")
      .setDescription("show help earn command")
  },
  run: async function (interaction: CommandInteraction) {
    const embed = getHelpEmbed(interaction.user)
    await buildHelpInterface(embed, defaultPageType)

    await interaction.editReply({
      embeds: [embed],
      components: pagination(defaultPageType),
    })
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          description: "Check on your quests and what rewards you can claim",
          usage: `${SLASH_PREFIX}earn quest`,
          examples: `${SLASH_PREFIX}earn quest`,
          footer: [`Type ${SLASH_PREFIX}earn`],
        }),
      ],
    }),
  colorType: "Server",
}

export default slashCmd
