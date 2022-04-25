import { Command } from "types/common"
import { emojis, getCommandArguments, getListCommands } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discord-embed"
import config from "./config"

const commands: Record<string, Command> = {
  config,
}

const command: Command = {
  id: "gm",
  command: "gm",
  name: "GM/GN",
  category: "Community",
  run: async function (msg, action) {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.run(msg)
    }

    const args = getCommandArguments(msg)
    if (args.length < 2) {
      return {
        messageOptions: await this.getHelpMessage(msg, action),
      }
    }
  },
  getHelpMessage: async (msg, action) => {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.getHelpMessage(msg)
    }
    const replyEmoji = msg.client.emojis.cache.get(emojis.REPLY)
    const embed = composeEmbedMessage(msg, {
      description: `\n\n**Usage**\`\`\`${PREFIX}gm <action>\`\`\`\n${getListCommands(
        replyEmoji ?? "╰ ",
        commands
      )}\n\n\nType \`${PREFIX}help gm <action>\` to learn more about a specific action!`,
    })

    return { embeds: [embed] }
  },
}

export default command
