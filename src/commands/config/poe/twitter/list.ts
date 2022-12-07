import config from "adapters/config"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { CommandInteraction, Message } from "discord.js"
import utc from "dayjs/plugin/utc"
import dayjs from "dayjs"
import { fromPrefix } from "./set"
import { emojis, getEmojiURL } from "utils/common"
import { APIError, GuildIdNotFoundError } from "errors"
dayjs.extend(utc)

export function getMessageBody({
  hashtag = [],
  user_id,
  channel_id,
  updated_at,
  from_twitter = [],
  twitter_username = [],
}: {
  user_id: string
  updated_at?: string
  channel_id: string
  hashtag?: string[]
  twitter_username?: string[]
  from_twitter?: string[]
}) {
  return `Set by: <@${user_id}>${
    updated_at
      ? ` (${dayjs(updated_at).utc().format("MMM DD YYYY HH:mm:ss UTC")})`
      : ""
  }\nCheck updates in <#${channel_id}>\nTags: ${hashtag
    .filter(Boolean)
    .map((t: string) => `\`${t}\``)
    .join(", ")}\nMentions: ${twitter_username
    .filter(Boolean)
    .map((t: string) => `\`${t}\``)
    .join(", ")}\nTweets from: ${from_twitter
    .filter(Boolean)
    .map((t: string) => `\`@${t.slice(fromPrefix.length)}\``)}`
}

export async function handlePoeTwitterList(
  msg: Message | CommandInteraction,
  guildId: string
) {
  const twitterConfig = await config.getTwitterConfig(guildId)

  if (!twitterConfig || !twitterConfig.ok || !twitterConfig?.data?.channel_id) {
    throw new APIError({
      message: msg,
      curl: twitterConfig.curl,
      description: twitterConfig.log,
    })
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Proof of Engagement list", getEmojiURL(emojis.TWITTER)],
          description: getMessageBody({
            user_id: twitterConfig.data.user_id,
            updated_at: twitterConfig.data.updated_at,
            channel_id: twitterConfig.data.channel_id,
            hashtag: twitterConfig.data.hashtag,
            twitter_username: twitterConfig.data.twitter_username,
            from_twitter: twitterConfig.data.from_twitter,
          }),
        }),
      ],
    },
  }
}

const command: Command = {
  id: "poe_twitter_list",
  command: "list",
  brief: "List all server's Twitter PoE configurations",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    return await handlePoeTwitterList(msg, msg.guildId)
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
