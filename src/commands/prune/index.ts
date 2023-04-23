import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
// slash
import inactiveSlash from "./inactive/slash"
import withoutSlash from "./without/slash"

const slashActions: Record<string, SlashCommand> = {
  inactive: inactiveSlash,
  without: withoutSlash,
}

const slashCmd: SlashCommand = {
  name: "prune",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("prune")
      .setDescription("Prune members")

    data.addSubcommand(<SlashCommandSubcommandBuilder>inactiveSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>withoutSlash.prepare())
    // data.addSubcommand(<SlashCommandSubcommandBuilder>safelistSlash.prepare())
    // data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
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

export default { slashCmd }
