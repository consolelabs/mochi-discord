import { Command } from "types/common"
import { emojis, getListCommands } from "utils/common"
import getlink from "./getlink"
import list from "./list"
import leaderboard from "./leaderboard"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discord-embed"

const commands: Record<string, Command> = {
  getlink,
  list,
  leaderboard,
}

const command: Command = {
  id: "invite",
  command: "invite",
  name: "Invite",
  category: "Community",
  run: async function (msg, action) {
    const actionObj = commands[action]
    if (actionObj) {
      return await actionObj.run(msg)
    }
  },
  getHelpMessage: async (msg, action) => {
    const actionObj = commands[action]
    if (actionObj) {
      return await actionObj.getHelpMessage(msg)
    } else {
      const replyEmoji = msg.client.emojis.cache.get(emojis.REPLY)
      const embed = composeEmbedMessage(msg, {
        thumbnail:
          "https://cdn.discordapp.com/emojis/900748086513639454.png?size=240",
        description: `\`\`\`Invite Tracker, tracks all your invites.\`\`\`\n${getListCommands(
          replyEmoji ?? "╰ ",
          commands
        )}\n\n\nType \`${PREFIX}help invite <action>\` to learn more about a specific action!`,
      })
      return { embeds: [embed] }
    }
  },
}

export default command
