import Config from "adapters/config"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

const command: Command = {
  id: "lr_remove",
  command: "remove",
  brief: "Remove a level-role configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    const args = getCommandArguments(msg)
    if (args.length < 3) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
    const level = +args[2]
    if (isNaN(level) || level <= 0) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({ msg, description: "Invalid level argument" }),
          ],
        },
      }
    }

    await Config.removeGuildLevelRoleConfig(msg.guildId, level)

    if (args)
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              description: `Level-role configuration removed for lv${level}`,
            }),
          ],
        },
      }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}lr remove <level>`,
        examples: `${PREFIX}lr remove 6`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["rm"],
  colorType: "Server",
}

export default command
