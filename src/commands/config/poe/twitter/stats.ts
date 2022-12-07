import config from "adapters/config"
import { CommandInteraction, Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { drawLeaderboard } from "utils/canvas"
import { getCommandArguments } from "utils/commands"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { DOT, PREFIX, VOTE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

export async function handlePoeTwitterStats(
  msg: Message | CommandInteraction,
  guild_id: string,
  page: number
) {
  const { curl, log, ok, data } = await config.getTwitterLeaderboard({
    guild_id,
    page,
  })

  if (!ok) {
    throw new APIError({ curl, description: log, message: msg })
  }

  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("cup")} ${msg.guild?.name}'s top 10 twitter users`,
    thumbnail: getEmojiURL(emojis.TWITTER),
    description: `\u200B\n\u200B\n\u200B`,
    image: "attachment://leaderboard.png",
  })

  return {
    messageOptions: {
      embeds: [embed],
      files: [
        await drawLeaderboard({
          rows:
            data?.data?.map((d: any) => ({
              username: d.twitter_handle,
              discriminator: "",
              rightValue: `${d.streak_count}/${d.total_count}`,
            })) ?? [],
          leftHeader: "Twitter users",
          rightHeader: "Streak/Total",
        }),
      ],
    },
  }
}

const command: Command = {
  id: "poe_twitter_stats",
  command: "stats",
  brief: "View twitter leaderboard",
  category: "Config",
  run: async (msg: Message) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    let page = args.length > 1 ? +args[1] : 0
    page = Math.max(isNaN(page) ? 0 : page - 1, 0)
    return await handlePoeTwitterStats(msg, msg.guildId, page)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}poe twitter stats`,
        examples: `${PREFIX}poe twitter stats`,
        document: `${VOTE_GITBOOK}&action=top`,
      }),
    ],
  }),
  colorType: "Server",
  aliases: ["leaderboard"],
}

export default command
