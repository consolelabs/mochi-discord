import config from "adapters/config"
import { Message } from "discord.js"
import { Command } from "types/common"
import { emojis, getEmojiURL } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { getMessageBody } from "../processor"

const command: Command = {
  id: "poe_twitter_list",
  command: "list",
  brief: "List all server's Twitter PoE configurations",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
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
    const twitterConfig = await config.getTwitterConfig(msg.guildId)

    if (
      !twitterConfig ||
      !twitterConfig.ok ||
      !twitterConfig?.data?.channel_id
    ) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              author: ["Proof of Engagement list", getEmojiURL(emojis.TWITTER)],
              description: `No available config`,
            }),
          ],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: ["Proof of Engagement list", getEmojiURL(emojis.TWITTER)],
            description: getMessageBody({
              user_id: twitterConfig.data.user_id,
              updated_at: twitterConfig.data.updated_at,
              channel_id: twitterConfig.data.channel_id,
              hashtag: twitterConfig.data.hashtag,
              twitter_username: twitterConfig.data.twitter_username,
              from_twitter: twitterConfig.data.from_twitter,
            }),
            color: "#FCD3C1",
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}poe twitter list`,
        examples: `${PREFIX}poe twitter list`,
        title: "Get config",
      }),
    ],
  }),
  colorType: "Server",
  canRunWithoutAction: true,
}

export default command
