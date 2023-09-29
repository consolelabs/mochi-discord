import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { render } from "./processor"

const slashCmd: SlashCommand = {
  name: "meStatus",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("me-status")
      .setDescription("List payme")
  },
  run: async (i: CommandInteraction) => {
    await render(i)
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default slashCmd
