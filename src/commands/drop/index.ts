import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { slashCmd as available } from "./available"
import { slashCmd as claimable } from "./claimable"
import { slashCmd as search } from "./search"

export enum AirdropCampaignStatus {
  Live = "live",
  Ended = "ended",
  Ignored = "ignored",
  Claimable = "claimable",
}

const slashActions = {
  available,
  claimable,
  search,
}

const slashCmd: SlashCommand = {
  name: "drop",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("drop")
      .setDescription("view airdrop earning opportunities")

    data.addSubcommand(<SlashCommandSubcommandBuilder>available.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>claimable.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>search.prepare())

    return data
  },
  run: (i) =>
    slashActions[
      i.options.getSubcommand(true) as keyof typeof slashActions
    ]?.run(i),
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
