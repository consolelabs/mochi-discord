import { Command } from "types/common"
import { PREFIX, REACTION_ROLE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import list from "./list"
import set from "./set"
import remove from "./remove"
import { getEmoji } from "utils/common"

const actions: Record<string, Command> = {
  list,
  set,
  remove,
}

const command: Command = {
  id: "reactionrole",
  command: "reactionrole",
  brief: "Reaction Role Configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  featured: {
    title: `${getEmoji("")} Reaction role`,
    description: "Assign a role corresponding to users' reaction",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}rr <action>`,
        examples: `${PREFIX}reactionrole list\n${PREFIX}rr list\n${PREFIX}reactionrole set https://discord.com/channels/...4875 ✅ @Visitor`,
        description: `Assign a role corresponding to users' reaction\n\n*Note:\n👉 When setting a new reaction role, please use the **custom emoji from this server** and the **Discord default emoji**.* ${getEmoji(
          "nekosad"
        )}`,
        footer: [`Type ${PREFIX}help rr <action> for a specific action!`],
        document: REACTION_ROLE_GITBOOK,
        includeCommandsList: true,
      }),
    ],
  }),
  aliases: ["rr"],
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

export default command
