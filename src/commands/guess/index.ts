import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { SlashCommand } from "types/common"
import newSlash from "./new/slash"
import choice from "./choice/slash"
import end from "./end/slash"
import list from "./list/slash"
import view from "./view/slash"

export const timeouts = new Map<string, NodeJS.Timeout>()
export const timers = new Map<string, NodeJS.Timer>()

const subCommands: Record<string, SlashCommand> = {
  new: newSlash,
  choice,
  end,
  list,
  view,
}

const slashCmd: SlashCommand = {
  name: "guess",
  category: "Game",
  autocomplete: async (i) => {
    await subCommands[i.options.getSubcommand(true)]?.autocomplete?.(i)
  },
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("guess")
      .setDescription("Mochi guessing game")

    data.addSubcommand(<SlashCommandSubcommandBuilder>newSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>choice.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>end.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>list.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>view.prepare())

    return data
  },
  run: (i) => subCommands[i.options.getSubcommand(true)]?.run(i),
  help: () => Promise.resolve({}),
  colorType: "Game",
}

export default { slashCmd }
