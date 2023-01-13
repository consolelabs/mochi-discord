import { Command, SlashCommand } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import daily from "./daily/text"
import dailySlash from "./daily/slash"

const actions: Record<string, Command> = {
  daily,
}

const textCmd: Command = {
  id: "quest",
  command: "quest",
  brief: "Shows the quests you currently have",
  category: "Community",
  run: async function (msg, action) {
    if (!action) return daily.run(msg)
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      description: "Check on your quests and what rewards you can claim",
      usage: `${PREFIX}quest`,
      footer: [`Type ${PREFIX}help quest`],
      examples: `${PREFIX}quest`,
    })

    return { embeds: [embed] }
  },
  actions,
  colorType: "Server",
  canRunWithoutAction: true,
}

const slashActions: Record<string, SlashCommand> = {
  daily: dailySlash,
}

const slashCmd: SlashCommand = {
  name: "quest",
  category: "Community",
  help: async () => {
    const embed = composeEmbedMessage(null, {
      description: "Check on your quests and what rewards you can claim",
      usage: `${PREFIX}quest `,
      footer: [`Type ${PREFIX}help quest`],
      examples: `${PREFIX}quest`,
    })

    return { embeds: [embed] }
  },
  colorType: "Server",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setDescription("Check on your quests and what rewards you can claim")
      .setName("quest")
    data.addSubcommand(<SlashCommandSubcommandBuilder>dailySlash.prepare())

    return data
  },
  run: async (interaction) => {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
}

export default { textCmd, slashCmd }
