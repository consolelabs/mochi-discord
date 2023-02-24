import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { PREFIX, SLASH_PREFIX, WALLET_GITBOOK } from "utils/constants"
import view from "./view/text"
import add from "./add/text"
import remove from "./remove/text"
import viewSlash from "./view/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const actions: Record<string, Command> = {
  view,
  add,
  remove,
}

const textCmd: Command = {
  id: "wallet",
  command: "wallet",
  brief: "",
  category: "Defi",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: "On-chain Wallet Tracking",
        usage: `${PREFIX}wallet <action>`,
        examples: `${PREFIX}wallet add 0xfBe6403a719d0572Ea4BA0E1c01178835b1D3bE4 mywallet\n${PREFIX}wallet view`,
        description: "Track assets and activities of any on-chain wallet.",
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  aliases: ["wal"],
  colorType: "Defi",
  canRunWithoutAction: false,
  allowDM: true,
}

const slashActions: Record<string, SlashCommand> = {
  view: viewSlash,
}

const slashCmd: SlashCommand = {
  name: "wallet",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("wallet")
      .setDescription("Track assets and activities of any on-chain wallet.")
    data.addSubcommand(<SlashCommandSubcommandBuilder>viewSlash.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        title: "On-chain Wallet Tracking",
        usage: `${SLASH_PREFIX}wallet <action>`,
        examples: `${SLASH_PREFIX}wallet add 0xfBe6403a719d0572Ea4BA0E1c01178835b1D3bE4 mywallet\n${SLASH_PREFIX}wallet view`,
        description: "Track assets and activities of any on-chain wallet.",
        includeCommandsList: true,
        document: WALLET_GITBOOK,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
