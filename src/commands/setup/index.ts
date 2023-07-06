import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { slashCmd as server } from "./server"
import { slashCmd as nft } from "./nft"
import { slashCmd as dao } from "./dao"
import { slashCmd as community } from "./community"
import { slashCmd as quest } from "./quest"

const subCommands: Record<string, SlashCommand> = {
  server,
  nft,
  dao,
  community,
  quest,
}

const slashCmd: SlashCommand = {
  name: "setup",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Setup for your guild")

    data.addSubcommand(<SlashCommandSubcommandBuilder>server.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>nft.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>dao.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>community.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>quest.prepare())

    return data
  },
  run: async function (interaction: CommandInteraction) {
    const subCmd = interaction.options.getSubcommand(true)
    return await subCommands[subCmd]?.run(interaction)
  },
  help: () => Promise.resolve({}),
  onlyAdministrator: true,
  colorType: "Server",
  ephemeral: true,
}

export default { slashCmd }
