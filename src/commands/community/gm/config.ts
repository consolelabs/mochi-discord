import { InvalidInputError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discord-embed"
import Config from "../../../adapters/config"

const command: Command = {
  id: "gm-config",
  command: "config",
  name: "Configure gm/gn channel",
  category: "Community",
  run: async (msg) => {
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

    await Config.createGmConfig(msg.guildId, channelId)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `Successfully configure ${channelArg} as GM/GN channel ${getEmoji(
              "good_morning"
            )}`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      description: "Configure gm/gn channel",
    }).addField("_Usage_", `\`${PREFIX}gm config <#channel>\`\n`)
    return {
      embeds: [embed],
    }
  },
  canRunWithoutAction: true,
}

export default command
