import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX, WALLET_GITBOOK } from "utils/constants"
import view from "./view/slash"
import add from "./add/slash"
import track from "./track/slash"
import follow from "./follow/slash"
import copy from "./copy/slash"
import list from "./list/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

export enum WalletTrackingType {
  Follow = "follow",
  Track = "track",
  Copy = "copy",
}

const slashActions: Record<string, SlashCommand> = {
  view,
  add,
  track,
  follow,
  copy,
  list,
}

const slashCmd: SlashCommand = {
  name: "wallet",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("wallet")
      .setDescription("Track assets and activities of any on-chain wallet.")
    data.addSubcommand(<SlashCommandSubcommandBuilder>view.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>add.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>track.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>follow.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>copy.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>list.prepare())
    return data
  },
  autocomplete: function (i) {
    const subCmd = i.options.getSubcommand()
    slashActions[subCmd]?.autocomplete?.(i)
    return Promise.resolve()
  },
  run: (interaction: CommandInteraction) => {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: (interaction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          title: "On-chain Wallet Tracking",
          usage: `${SLASH_PREFIX}wallet <action>`,
          examples: `${SLASH_PREFIX}wallet add\n${SLASH_PREFIX}wallet view`,
          description: "Track assets and activities of any on-chain wallet.",
          includeCommandsList: true,
          document: WALLET_GITBOOK,
        }),
      ],
    }),
  colorType: "Defi",
}

export default { slashCmd }
