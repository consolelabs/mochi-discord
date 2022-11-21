import { GuildIdNotFoundError, InternalError } from "errors"
import { Command } from "types/common"
import { getEmoji, getEmojiURL, emojis } from "utils/common"
import { getCommandArguments } from "utils/commands"
import { GM_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Config from "../../../adapters/config"

export async function handle(guildId: string, channelId: string) {
  await Config.updateGmConfig(guildId, channelId)
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["GM / GN", getEmojiURL(emojis["APPROVE"])],
          description: `Successfully configure <#${channelId}> as GM/GN channel ${getEmoji(
            "good_morning"
          )}`,
        }),
      ],
    },
  }
}
const command: Command = {
  id: "gm_config",
  command: "config",
  brief: "Configure gm/gn channel",
  category: "Community",
  run: async (msg) => {
    if (!msg.guildId || !msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    const channelArg = args[2]
    if (!channelArg?.startsWith("<#") || !channelArg?.endsWith(">")) {
      throw new InternalError({ message: msg })
    }

    const channelId = channelArg.slice(2, channelArg.length - 1)
    const chan = await msg.guild.channels
      .fetch(channelId)
      .catch(() => undefined)
    if (!chan) throw new InternalError({ message: msg })
    return await handle(msg.guildId, chan.id)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}gm config <channel>`,
        examples: `${PREFIX}gm config #general`,
        document: `${GM_GITBOOK}&action=config`,
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
