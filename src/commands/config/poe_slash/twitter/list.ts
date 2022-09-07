import config from "adapters/config"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import utc from "dayjs/plugin/utc"
import dayjs from "dayjs"
import { fromPrefix } from "./set"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

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

export async function twitterList(interaction: CommandInteraction) {
  if (!interaction.guildId || !interaction.guild) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "This command must be run in a Guild",
          }),
        ],
      },
    }
  }
  const twitterConfig = await config.getTwitterConfig(interaction.guildId)

  if (!twitterConfig || !twitterConfig.ok || !twitterConfig?.data?.channel_id) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: [interaction.guild.name, interaction.guild.iconURL()],
            description: `No available config`,
          }),
        ],
      },
    }
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: [interaction.guild.name, interaction.guild.iconURL()],
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

export const list = new SlashCommandSubcommandBuilder()
  .setName("list")
  .setDescription("See your server's PoE config")
