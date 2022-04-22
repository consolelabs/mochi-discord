import { Command } from "types/common"
import leaderboard from "./leaderboard"
import codes from "./codes"
import { emojis, getCommandArguments, getListCommands } from "utils/common"
import { composeEmbedMessage } from "utils/discord-embed"
import { PREFIX } from "utils/constants"

const commands: Record<string, Command> = {
  leaderboard,
  codes,
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

    const args = getCommandArguments(msg)
    if (args.length === 1) {
      return {
        messageOptions: await this.getHelpMessage(msg, action),
      }
    }

    const mentionedUser = args[1]
    // TODO: handle to show a user's invites'
    // TODO: validate mentioned user, e.g. <@12312312313>
  },
  getHelpMessage: async (msg, action) => {
    const actionObj = commands[action]
    if (actionObj) {
      return await actionObj.getHelpMessage(msg)
    }
    const replyEmoji = msg.client.emojis.cache.get(emojis.REPLY)
    const embed = composeEmbedMessage(msg, {
      description: `Invite Tracker\n\n**Usage**\`\`\`${PREFIX}invite <user> or ${PREFIX}invite <action>\`\`\`\n${getListCommands(
        replyEmoji ?? "╰ ",
        commands
      )}\n\n\nType \`${PREFIX}help invite <action>\` to learn more about a specific action!`,
    })

    return { embeds: [embed] }
  },
  alias: ["inv", "invites"],
}

export default command
