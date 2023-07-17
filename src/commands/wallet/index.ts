import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX, WALLET_GITBOOK } from "utils/constants"

import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"

import add from "./add/slash"
import alias from "./alias"
import copy from "./copy/slash"
import follow from "./follow/slash"
import list from "./list/slash"
import track from "./track/slash"
import untrack from "./untrack/slash"
import view from "./view"

export enum WalletTrackingType {
  Follow = "follow",
  Track = "track",
  Copy = "copy",
}

const slashActions: Record<string, SlashCommand> = {
  add,
  track,
  follow,
  copy,
  list,
  untrack,
}

const subCommandGroups: Record<string, Record<string, SlashCommand>> = {
  alias,
  view,
}

const slashCmd: SlashCommand = {
  name: "wallet",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("wallet")
      .setDescription("Track assets and activities of any on-chain wallet.")
    data.addSubcommand(<SlashCommandSubcommandBuilder>add.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>track.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>follow.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>copy.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>list.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>untrack.prepare())
    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("alias")
        .setDescription("Setup alias for wallet address")
        .addSubcommand(<SlashCommandSubcommandBuilder>alias.set.prepare())
        .addSubcommand(<SlashCommandSubcommandBuilder>alias.remove.prepare())
    )
    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("view")
        .setDescription("View wallet")
        .addSubcommand(<SlashCommandSubcommandBuilder>view.address.prepare())
        .addSubcommand(<SlashCommandSubcommandBuilder>view.profile.prepare())
    )
    return data
  },
  autocomplete: function (i) {
    const subCmd = i.options.getSubcommand()
    if (subCmd in slashActions) {
      slashActions[subCmd]?.autocomplete?.(i)
    } else {
      const subCmdGroup = i.options.getSubcommandGroup(true)
      subCommandGroups[subCmdGroup][
        i.options.getSubcommand(true)
      ].autocomplete?.(i)
    }
    return Promise.resolve()
  },
  run: (interaction: CommandInteraction) => {
    const subCmd = interaction.options.getSubcommand()
    if (subCmd in slashActions) {
      return slashActions[subCmd].run(interaction)
    } else {
      const subCmdGroup = interaction.options.getSubcommandGroup(true)
      return subCommandGroups[subCmdGroup][
        interaction.options.getSubcommand(true)
      ].run(interaction)
    }
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
