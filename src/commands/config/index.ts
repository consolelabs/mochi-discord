import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import logChannelSetSlash from "./logchannel/set/slash"
import logChannelInfoSlash from "./logchannel/info/slash"

const subCommandGroups: Record<string, Record<string, SlashCommand>> = {
  logchannel: {
    set: logChannelSetSlash,
    info: logChannelInfoSlash,
  },
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

    return data
  },
  run: async function (i) {
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
