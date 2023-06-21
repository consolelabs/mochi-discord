import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import info from "./info/slash"
import remove from "./remove/slash"
import set from "./set/slash"
import CacheManager from "cache/node-cache"

const actions: Record<string, SlashCommand> = {
  set,
  remove,
  info,
}

CacheManager.init({
  ttl: 0,
  pool: "bot-manager",
  checkperiod: 1,
})

const slashCmd: SlashCommand = {
  name: "bot-manager",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("bot-manager")
      .setDescription("Manage bot settings")
    data.addSubcommand(<SlashCommandSubcommandBuilder>set.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>info.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>remove.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return actions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        usage: `${SLASH_PREFIX}bot-manager <action>`,
        description: "Manage bot settings",
        examples: `${SLASH_PREFIX}bot-manager info\n${SLASH_PREFIX}bot-manager set <role>\n${SLASH_PREFIX}bot-manager remove`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
}

export default { slashCmd }
