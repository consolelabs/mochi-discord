import { SlashCommand } from "types/common"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { info, logInfo } from "./info"
import { set, setLog } from "./set"
import { composeEmbedMessage } from "utils/discordEmbed"

const command: SlashCommand = {
  name: "log",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("log")
      .setDescription("Monitor guild members' activities")

    data.addSubcommand(info).addSubcommand(set)
    return data
  },
  run: async function (interaction: CommandInteraction) {
    if (interaction.options.getSubcommand() === info.name) {
      return logInfo(interaction)
    }
    return setLog(interaction)
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default command
