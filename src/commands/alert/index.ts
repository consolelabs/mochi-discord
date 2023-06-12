import { SlashCommand } from "types/common"
import { PRICE_ALERT_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
// slash
import listSlash from "./list/slash"
import removeSlash from "./remove/slash"
import addSlash from "./add/slash"

const slashActions: Record<string, SlashCommand> = {
  list: listSlash,
  remove: removeSlash,
  add: addSlash,
}

const slashCmd: SlashCommand = {
  name: "alert",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("alert")
      .setDescription("Get notifications every time the price change")
    data.addSubcommand(<SlashCommandSubcommandBuilder>listSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>addSlash.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}alert <action>`,
        description: "Get notifications every time the price change",
        examples: `${SLASH_PREFIX}alert list\n${SLASH_PREFIX}alert add ftm`,
        document: `${PRICE_ALERT_GITBOOK}`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
}

export default { slashCmd }
