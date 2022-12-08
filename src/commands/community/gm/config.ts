import { GuildIdNotFoundError, InternalError, APIError } from "errors"
import { Command } from "types/common"
import { getEmoji, getEmojiURL, emojis } from "utils/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { GM_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Config from "../../../adapters/config"
import { throwOnInvalidEmoji } from "utils/emoji"

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
    const { isChannel, value: channelId } = parseDiscordToken(channelArg)
    if (!isChannel) {
      throw new InternalError({
        title: "Command Error",
        message: msg,
        description: "Invalid channel. Type #, then choose the valid one!",
      })
    }
    const stickerArg = msg.stickers.first()?.id ?? ""
    let messageText = "gm/gn"
    let emoji = getEmoji("gm")

    let { isEmoji, isNativeEmoji, isAnimatedEmoji } = parseDiscordToken(
      args[4] ?? ""
    )
    if (!isEmoji && !isNativeEmoji && !isAnimatedEmoji) {
      // maybe the user is only setting emoji and no phrase -> check if the 3rd argument is emoji
      ;({ isEmoji, isNativeEmoji, isAnimatedEmoji } = parseDiscordToken(
        args[3] ?? ""
      ))

      if (!isEmoji && !isNativeEmoji && !isAnimatedEmoji) {
        // maybe user is only setting phrase ->
        messageText = args[3]
      } else {
        emoji = args[3]
      }
    } else {
      messageText = args[3]
      emoji = args[4]
    }
    throwOnInvalidEmoji(emoji, msg)

    return await handle(msg.guildId, channelId, messageText, emoji, stickerArg)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `To set a gm channel with gm/gn:\n${PREFIX}gm config <channel>\n\nTo set customize the repeated phrase:\n${PREFIX}gm config <channel> [phrase] [emoji] [insert sticker]`,
        examples: `${PREFIX}gm config #general\n${PREFIX}gm config #whoop-channel whoop ⛅`,
        description: `*Note:\n👉 When setting a new starboard, please use the **custom emoji, sticker from this server** and the **Discord default emoji, sticker**.* ${getEmoji(
          "nekosad"
        )}`,
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
