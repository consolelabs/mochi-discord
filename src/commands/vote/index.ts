import { Command, SlashCommand } from "types/common"
import { getEmoji } from "utils/common"
import { PREFIX, VOTE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
// text
import vote from "./index/text"
import info from "./info/text"
import remove from "./remove/text"
import set from "./set/text"
import top from "./top/text"
// slash
import voteSlash from "./index/slash"
// import infoSlash from "./info/slash"
// import removeSlash from "./remove/slash"
// import setSlash from "./set/slash"
// import topSlash from "./top/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const actions: Record<string, Command> = {
  set,
  info,
  remove,
  top,
}

const textCmd: Command = {
  id: "vote",
  command: "vote",
  brief: "Display voting streaks and links to vote",
  category: "Community",
  run: vote,
  featured: {
    title: `${getEmoji("like")} Vote`,
    description:
      "Vote for us on top.gg and discordbotlist.com and earn rewards",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}vote`,
        examples: `${PREFIX}vote\n${PREFIX}vote top\n${PREFIX}vote set #vote`,
        includeCommandsList: true,
        document: VOTE_GITBOOK,
        description:
          "Vote for Mochi Bot on top.gg and discordbotlist.com platform, by voting you can earn rewards, use some premium-only features of Mochi and more benefits to come.",
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
  actions,
}

// const slashActions: Record<string, SlashCommand> = {
//   set: setSlash,
//   info: infoSlash,
//   remove: removeSlash,
//   top: topSlash,
// }

const slashCmd: SlashCommand = {
  name: "vote",
  category: "Community",
  help: async () => {
    return {
      embeds: [
        composeEmbedMessage(null, {
          usage: `${PREFIX}vote`,
          examples: `${PREFIX}vote\n${PREFIX}vote top\n${PREFIX}vote set #vote`,
          includeCommandsList: true,
        }),
      ],
    }
  },
  colorType: "Server",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setDescription("Display voting streaks and links to vote")
      .setName("vote")
    // data.addSubcommand(<SlashCommandSubcommandBuilder>setSlash.prepare())
    // data.addSubcommand(<SlashCommandSubcommandBuilder>infoSlash.prepare())
    // data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    // data.addSubcommand(<SlashCommandSubcommandBuilder>topSlash.prepare())
    return data
  },
  ephemeral: true,
  run: voteSlash,
}

export default { textCmd, slashCmd }
