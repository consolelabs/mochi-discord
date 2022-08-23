import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import set from "./set"
import info from "./info"

const actions: Record<string, Command> = {
  set,
  info,
}

const command: Command = {
  id: "log",
  command: "log",
  brief: "Monitor guild members' activities",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [composeEmbedMessage(msg, { includeCommandsList: true })],
  }),
  colorType: "Server",
  actions,
}

export default command
