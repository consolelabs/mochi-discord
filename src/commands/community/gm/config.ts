import { InvalidInputError } from "errors"
import { Command } from "types/common"
import { getEmoji } from "utils/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Config from "../../../adapters/config"

const command: Command = {
  id: "gm_config",
  command: "config",
  brief: "Configure gm/gn channel",
  category: "Community",
  run: async msg => {
    const args = getCommandArguments(msg)
    const channelArg = args[2]
    if (
      !channelArg ||
      !channelArg.startsWith("<#") ||
      !channelArg.endsWith(">")
    ) {
      throw new InvalidInputError({ message: msg })
    }

    const channelId = channelArg.slice(2, channelArg.length - 1)
    const chan = await msg.guild.channels.fetch(channelId).catch(() => {})
    if (!chan) throw new InvalidInputError({ message: msg })

    await Config.updateGmConfig(msg.guildId, channelId)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `Successfully configure ${channelArg} as GM/GN channel ${getEmoji(
              "good_morning"
            )}`
          })
        ]
      }
    }
  },
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}gm config <channel>`,
        examples: `${PREFIX}gm config #general`
      })
    ]
  }),
  canRunWithoutAction: true
}

export default command
