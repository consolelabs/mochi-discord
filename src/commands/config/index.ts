import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
// logchannel
import logChannelSetSlash from "./logchannel/set/slash"
import logChannelInfoSlash from "./logchannel/info/slash"
// currency
import currencySlash from "./currency/index/slash"
import minrainSlash from "./minrain/index/slash"
import maxtippedSlash from "./maxtipped/index/slash"
import tiprangeSlash from "./tiprange/index/slash"

const subCommandGroups: Record<string, Record<string, SlashCommand>> = {
  logchannel: {
    set: logChannelSetSlash,
    info: logChannelInfoSlash,
  },
}

const subCommands: Record<string, SlashCommand> = {
  currency: currencySlash,
  minrain: minrainSlash,
  maxtipped: maxtippedSlash,
  tiprange: tiprangeSlash,
}
const slashCmd: SlashCommand = {
  name: "config",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("config")
      .setDescription("Config various aspects of the server")

    // logchannel
    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("logchannel")
        .setDescription(
          "Keep all records of every user's activity and interaction"
        )
        .addSubcommand(
          <SlashCommandSubcommandBuilder>logChannelSetSlash.prepare()
        )
        .addSubcommand(
          <SlashCommandSubcommandBuilder>logChannelInfoSlash.prepare()
        )
    )

    // currency
    data.addSubcommand(<SlashCommandSubcommandBuilder>currencySlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>minrainSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>maxtippedSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>tiprangeSlash.prepare())
    return data
  },
  run: async function (i) {
    const subCommandGroup = i.options.getSubcommandGroup(false)
    const subCommand = i.options.getSubcommand(true)

    if (!subCommandGroup && subCommand) {
      return subCommands[subCommand].run(i)
    }

    return subCommandGroups[i.options.getSubcommandGroup(true)][
      i.options.getSubcommand(true)
    ].run(i)
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default { slashCmd }
