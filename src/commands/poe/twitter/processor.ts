import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

export const fromPrefix = "from:"
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
