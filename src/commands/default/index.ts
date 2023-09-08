import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { LOG_CHANNEL_GITBOOK, SLASH_PREFIX } from "utils/constants"
import tickerInfoSlash from "./ticker/info/slash"
import tickerSetSlash from "./ticker/set/slash"

const subCommandGroups: Record<string, Record<string, SlashCommand>> = {
  ticker: {
    set: tickerSetSlash,
    info: tickerInfoSlash,
  },
}

const slashCmd: SlashCommand = {
  name: "default",
  category: "Config",
  autocomplete: function (i) {
    subCommandGroups[i.options.getSubcommandGroup(true)][
      i.options.getSubcommand(true)
    ].autocomplete?.(i)
    return Promise.resolve()
  },
  onlyAdministrator: function (i) {
    const onlyAdmin =
      subCommandGroups[i.options.getSubcommandGroup(true)][
        i.options.getSubcommand(true)
      ].onlyAdministrator
    if (typeof onlyAdmin === "function") return onlyAdmin(i)
    return Boolean(onlyAdmin)
  },
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("default")
      .setDescription("Setup default aspect for your guild")

    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("ticker")
        .setDescription("Set default ticker for your guild")
        .addSubcommand(<SlashCommandSubcommandBuilder>tickerSetSlash.prepare())
        .addSubcommand(
          <SlashCommandSubcommandBuilder>tickerInfoSlash.prepare(),
        ),
    )

    return data
  },
  run: function (i) {
    return subCommandGroups[i.options.getSubcommandGroup(true)][
      i.options.getSubcommand(true)
    ].run(i)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        includeCommandsList: true,
        usage: `${SLASH_PREFIX}default <action>`,
        description: "Setup default aspect for your guild",
        footer: [
          `Type ${SLASH_PREFIX}help default <action> for a specific action!`,
        ],
        document: LOG_CHANNEL_GITBOOK,
        title: "Default",
        examples: `${SLASH_PREFIX}default ticker info`,
      }),
    ],
  }),
  colorType: "Server",
}

export default { slashCmd }
