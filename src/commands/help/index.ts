import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { SlashCommand } from "types/common"
import helpSlash from "./index/slash"
import { slashCommands } from "commands"
import { CommandInteraction } from "discord.js"
import { SlashCommandBuilder } from "@discordjs/builders"
dayjs.extend(utc)

const slashCmd: SlashCommand = {
  name: "help",
  category: "Profile",
  prepare: (slashCommands) => {
    const choices = Object.keys(slashCommands ?? {})
      .filter((c) => c !== "help")
      .map((c) => [`/${c}`, c]) as [string, string][]
    return new SlashCommandBuilder()
      .setName("help")
      .setDescription("Help Menu")
      .addStringOption((option) =>
        option
          .setName("command")
          .setDescription(
            "Command to provide details about. Example: watchlist"
          )
          .setRequired(false)
          .setChoices(choices)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const command = interaction.options.getString("command") ?? ""
    if (slashCommands[command]) {
      const messageOptions = await slashCommands[command].help(interaction)
      return {
        messageOptions,
      }
    }
    await this.help(interaction)
    return null
  },
  help: helpSlash,
  colorType: "Command",
}

export default { slashCmd }
