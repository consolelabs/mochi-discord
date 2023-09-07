import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { SlashCommand } from "types/common"
import profile from "./profile/slash"
import email from "./email/slash"
import apiKey from "./apiKey/slash"
import binance from "./binance/index"
import coinbase from "./coinbase/slash"
import twitter from "./twitter/slash"
import telegram from "./telegram/slash"

const slashActions = {
  profile: profile.slashCmd,
  email: email.slashCmd,
  apiKey: apiKey.slashCmd,
  binance: binance.slashCmd,
  coinbase: coinbase.slashCmd,
  twitter: twitter.slashCmd,
  telegram: telegram.slashCmd,
}

const slashCmd: SlashCommand = {
  name: "update",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("update")
      .setDescription("Update your user setting")

    data.addSubcommand(
      <SlashCommandSubcommandBuilder>profile.slashCmd.prepare(),
    )
    data.addSubcommand(<SlashCommandSubcommandBuilder>email.slashCmd.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>apiKey.slashCmd.prepare())
    data.addSubcommand(
      <SlashCommandSubcommandBuilder>binance.slashCmd.prepare(),
    )
    data.addSubcommand(
      <SlashCommandSubcommandBuilder>coinbase.slashCmd.prepare(),
    )
    data.addSubcommand(
      <SlashCommandSubcommandBuilder>twitter.slashCmd.prepare(),
    )
    data.addSubcommand(
      <SlashCommandSubcommandBuilder>telegram.slashCmd.prepare(),
    )

    return data
  },
  run: (i) =>
    slashActions[
      i.options.getSubcommand(true) as keyof typeof slashActions
    ]?.run(i),
  help: () => Promise.resolve({}),
  colorType: "Server",
  ephemeral: true,
}

export default { slashCmd }
