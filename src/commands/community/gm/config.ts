import { GuildIdNotFoundError, InternalError, APIError } from "errors"
import { Command } from "types/common"
import { getEmoji, getEmojiURL, emojis } from "utils/common"
import { getCommandArguments } from "utils/commands"
import { GM_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Config from "../../../adapters/config"

export async function handle(
  guildId: string,
  channelId: string,
  msg: string,
  emoji: string,
  sticker: string
) {
  const config = await Config.updateGmConfig({
    guild_id: guildId,
    channel_id: channelId,
    msg,
    emoji,
    sticker,
  })
  if (!config.ok) {
    throw new APIError({ curl: config.curl, description: config.log })
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Successfully set", getEmojiURL(emojis["APPROVE"])],
          description: `${getEmoji(
            "good_morning"
          )} Let your members repeat the phrase "${msg}", or ${emoji} in <#${channelId}> to join the streak.`,
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
    const stickerArg = msg.stickers.first()?.id ?? ""
    if (!channelArg?.startsWith("<#") || !channelArg?.endsWith(">")) {
      throw new InternalError({ message: msg })
    }

    const channelId = channelArg.slice(2, channelArg.length - 1)
    const chan = await msg.guild.channels
      .fetch(channelId)
      .catch(() => undefined)
    if (!chan) throw new InternalError({ message: msg })
    return await handle(msg.guildId, chan.id, args[3], args[4], stickerArg)
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
