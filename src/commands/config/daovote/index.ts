import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import set from "./set"
import info from "./info"
import remove from "./remove"

const actions: Record<string, Command> = {
  set,
  info,
  remove,
}

const command: Command = {
  id: "daovote",
  command: "daovote",
  brief: "DAO Voting",
  category: "Config",
  run: async () => null,
  featured: {
    title: "DAO Voting",
    description: "Manage to post proposals and their voting space",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: "DAO Voting",
        description: "Manage to post proposals and their voting space",
        usage: `${PREFIX}daovote <action>`,
        examples: `${PREFIX}daovote info\n${PREFIX}daovote set #channel eth 0xad29abb318791d579433d831ed122afeaf29dcfe`,
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  canRunWithoutAction: false,
  colorType: "Defi",
  minArguments: 2,
  aliases: ["dv"],
}

export default command
