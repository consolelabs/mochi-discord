import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { LOG_CHANNEL_GITBOOK, SLASH_PREFIX } from "utils/constants"

// slash
import tickerSlash from "./ticker/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const slashActions: Record<string, SlashCommand> = {
  ticker: tickerSlash,
}

const slashCmd: SlashCommand = {
  name: "default",
  category: "Config",
  onlyAdministrator: function (i) {
    const onlyAdmin = slashActions[i.options.getSubcommand()].onlyAdministrator
    if (typeof onlyAdmin === "function") return onlyAdmin(i)
    return Boolean(onlyAdmin)
  },
  autocomplete: function (i) {
    const subCmd = i.options.getSubcommand()
    slashActions[subCmd]?.autocomplete?.(i)
    return Promise.resolve()
  },
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("default")
      .setDescription("Setup default aspect for your guild")
    data.addSubcommand(<SlashCommandSubcommandBuilder>tickerSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (i) => ({
    embeds: [
      composeEmbedMessage2(i, {
        includeCommandsList: true,
        usage: `${SLASH_PREFIX}default <action>`,
        description: "Setup default aspect for your guild",
        footer: [
          `Type ${SLASH_PREFIX}help default <action> for a specific action!`,
        ],
        document: LOG_CHANNEL_GITBOOK,
        title: "Default",
        examples: `${SLASH_PREFIX}default ticker ftm`,
      }),
    ],
  }),
  colorType: "Server",
}

export default { slashCmd }
