import { GuildIdNotFoundError, InternalError, APIError } from "errors"
import { Command } from "types/common"
import { getEmoji } from "utils/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { GM_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { throwOnInvalidEmoji } from "utils/emoji"
import { handle } from "./processor"
import profile from "adapters/profile"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_GM,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { sendActivityMsg, defaultActivityMsg } from "utils/activity"

const command: Command = {
  id: "gm_set",
  command: "set",
  brief: "Set gm/gn channel",
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
        msgOrInteraction: msg,
        description: "Invalid channel. Type #, then choose the valid one!",
      })
    }
    const stickerArg = msg.stickers.first()?.id ?? ""
    let messageText = "gm/gn"
    let emoji = getEmoji("GM")

    let { isEmoji, isNativeEmoji, isAnimatedEmoji } = parseDiscordToken(
      args[4] ?? "",
    )
    if (!isEmoji && !isNativeEmoji && !isAnimatedEmoji) {
      // maybe the user is only setting emoji and no phrase -> check if the 3rd argument is emoji
      ;({ isEmoji, isNativeEmoji, isAnimatedEmoji } = parseDiscordToken(
        args[3] ?? "",
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
    // send activity
    const channel = msg?.guild?.channels.cache.get(channelId)
    const dataProfile = await profile.getByDiscord(msg?.author.id)
    if (dataProfile.err) {
      throw new APIError({
        msgOrInteraction: msg,
        description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
        curl: "",
        status: dataProfile.status ?? 500,
      })
    }
    const kafkaMsg: KafkaQueueActivityDataCommand = defaultActivityMsg(
      dataProfile.id,
      MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
      MOCHI_APP_SERVICE,
      MOCHI_ACTION_GM,
    )
    kafkaMsg.activity.content.channel_name = channel?.name
    sendActivityMsg(kafkaMsg)

    return await handle(msg.guildId, channelId, messageText, emoji, stickerArg)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `To set a gm channel with gm/gn:\n${PREFIX}gm set <channel>\n\nTo set customize the repeated phrase:\n${PREFIX}gm set <channel> [phrase] [emoji] [insert sticker]`,
        examples: `${PREFIX}gm set #general\n${PREFIX}gm set #whoop-channel whoop ⛅`,
        description: `*Note:\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true,
        )} When setting a new starboard, please use the **custom emoji, sticker from this server** and the **Discord default emoji, sticker**.* ${getEmoji(
          "NEKOSAD",
        )}`,
        document: `${GM_GITBOOK}&action=config`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Command",
  minArguments: 3,
  onlyAdministrator: true,
}

export default command
