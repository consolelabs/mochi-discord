import { disabledVoteEmbed } from "./processor"

const run = async () => {
  // if (!msg.guildId) {
  //   throw new GuildIdNotFoundError({ message: msg })
  // }
  // const res = await handleInfo(msg.guildId, msg)
  // if (res?.channel_id && msg.channelId !== res?.channel_id) {
  //   return {
  //     messageOptions: {
  //       embeds: [
  //         composeEmbedMessage(msg, {
  //           author: ["Go to the vote channel", getEmojiURL(emojis.SOCIAL)],
  //           description: `You can only vote in <#${res.channel_id}>.`,
  //         }),
  //       ],
  //     },
  //   }
  // } else {
  //   await setCache(msg)
  //   return handle(msg.author)
  // }
  return {
    messageOptions: {
      embeds: [disabledVoteEmbed()],
    },
  }
}
export default run
