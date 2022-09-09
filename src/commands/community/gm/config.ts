import { InvalidInputError } from "errors"
import { Command } from "types/common"
import { getEmoji, getEmojiURL, emojis } from "utils/common"
import { getCommandArguments } from "utils/commands"
import { GM_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import Config from "../../../adapters/config"

const command: Command = {
  id: "gm_config",
  command: "config",
  brief: "Configure gm/gn channel",
  category: "Community",
  run: async (msg) => {
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
    const channelArg = args[2]
    if (!channelArg?.startsWith("<#") || !channelArg?.endsWith(">")) {
      throw new InvalidInputError({ message: msg })
    }

    const channelId = channelArg.slice(2, channelArg.length - 1)
    const chan = await msg.guild.channels
      .fetch(channelId)
      .catch(() => undefined)
    if (!chan) throw new InvalidInputError({ message: msg })

    await Config.updateGmConfig(msg.guildId, channelId)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: ["GM / GN", getEmojiURL(emojis["APPROVE"])],
            description: `Successfully configure ${channelArg} as GM/GN channel ${getEmoji(
              "good_morning"
            )}`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}gm config <channel>`,
        examples: `${PREFIX}gm config #general`,
        document: GM_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["cfg"],
  colorType: "Command",
  minArguments: 3,
  onlyAdministrator: true,
}

export default command
