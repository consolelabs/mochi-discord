import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { inactive, pruneInactive } from "./inactive"
import { without, pruneWithoutRole } from "./without"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const command: SlashCommand = {
  name: "prune",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("prune")
      .setDescription("Prune members")

    data.addSubcommand(inactive).addSubcommand(without)
    return data
  },
  run: async function (interaction: CommandInteraction) {
    switch (interaction.options.getSubcommand()) {
      case inactive.name:
        return pruneInactive(interaction)
      case without.name:
        return pruneWithoutRole(interaction)
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}prune <option>`,
        footer: [`Type ${SLASH_PREFIX}help prune for a specific action!`],
        includeCommandsList: true,
        originalMsgAuthor: interaction.user,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
