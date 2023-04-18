import { Command, SlashCommand } from "types/common"
import stats from "./index/text"
import statsSlash from "./index/slash"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, SLASH_PREFIX } from "utils/constants"
import { SlashCommandBuilder } from "@discordjs/builders"

const textCmd: Command = {
  id: "stats",
  command: "stats",
  brief: "Server Stats",
  category: "Community",
  onlyAdministrator: true,
  run: stats,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}stats -> select which stats from dropdown -> select which type from dropdown`,
        footer: [`Type ${PREFIX}help stats`],
        examples: `${PREFIX}stats`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
  aliases: ["stat"],
}

const slashCmd: SlashCommand = {
  name: "stats",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("stats")
      .setDescription("Shows different server stats")
  },
  run: statsSlash,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}stats -> select which stats from dropdown -> select which type from dropdown`,
        footer: [`Type ${SLASH_PREFIX}help stats`],
        examples: `${SLASH_PREFIX}stats`,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
