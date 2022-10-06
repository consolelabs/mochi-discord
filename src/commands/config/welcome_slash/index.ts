import { SlashCommand } from "types/common"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { info, welcomeInfo } from "./info"
import { set, setWelcome } from "./set"
import { remove, removeWelcome } from "./remove"
import { message, setWelcomeMessage } from "./message"
import { composeEmbedMessage } from "utils/discordEmbed"

const command: SlashCommand = {
  name: "welcome",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("welcome")
      .setDescription("Welcome new members to the guild")

    data
      .addSubcommand(info)
      .addSubcommand(set)
      .addSubcommand(remove)
      .addSubcommand(message)
    return data
  },
  run: async function (interaction: CommandInteraction) {
    switch (interaction.options.getSubcommand()) {
      case info.name:
        return welcomeInfo(interaction)
      case set.name:
        return setWelcome(interaction)
      case remove.name:
        return removeWelcome(interaction)
      case message.name:
        return setWelcomeMessage(interaction)
      default:
        break
    }
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default command
