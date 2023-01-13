import Config from "adapters/config"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"

const command: Command = {
  id: "lr_remove",
  command: "remove",
  brief: "Remove a level role configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const args = getCommandArguments(msg)
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

    // not set level role yet but remove it
    const configs = await Config.getGuildLevelRoleConfigs(msg.guildId)
    if (configs.data?.length == 0 || !configs.ok) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: `No level roles found`,
              description: `You haven't set any roles for this level yet. \n\nTo set a new one, run \`$lr @<role> <level>\`. \nThen re-check your configuration using \`$lr list\`.`,
            }),
          ],
        },
      }
    }

    await Config.removeGuildLevelRoleConfig(msg.guildId, level)

    if (args)
      return {
        messageOptions: {
          embeds: [
            getSuccessEmbed({
              msg,
              description: `Level role configuration removed for lv${level}.\nTo set a new one, run \`$lr <role> <level>\`.`,
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
  minArguments: 3,
}

export default command
