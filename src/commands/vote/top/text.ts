import community from "adapters/community"
import { Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { drawLeaderboard } from "ui/canvas/draw"
import { getEmoji } from "utils/common"
import { PREFIX, VOTE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"

const command: Command = {
  id: "vote_top",
  command: "top",
  brief: "View vote leaderboard",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const res = await community.getVoteLeaderboard(msg.guild.id)

    if (!res.ok) {
      throw new APIError({ curl: res.curl, description: res.log, message: msg })
    }

    const embed = composeEmbedMessage(msg, {
      title: `${getEmoji("cup")} ${msg.guild.name}'s top 10 voters`,
      thumbnail:
        "https://media.discordapp.net/attachments/984660970624409630/1016614817433395210/Pump_eet.png",
      description: `\u200B\n\u200B\n\u200B`,
      image: "attachment://leaderboard.png",
    })

    return {
      messageOptions: {
        embeds: [embed],
        files: [
          await drawLeaderboard({
            rows: await Promise.all(
              res.data?.map(async (d) => {
                const user = await msg.guild?.members?.fetch(d.discord_id ?? "")
                if (user) {
                  return {
                    username: user.user.username,
                    discriminator: user.user.discriminator,
                    rightValue: `${d.streak_count ?? 0}/${d.total_count ?? 0}`,
                  }
                } else {
                  return {
                    username: "Unknown",
                    discriminator: "#?",
                    rightValue: `${d.streak_count ?? 0}/${d.total_count ?? 0}`,
                  }
                }
              }) ?? []
            ),
            leftHeader: "Voters",
            rightHeader: "Streak/Total",
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}vote set <channel>`,
        examples: `${PREFIX}vote set #vote`,
        includeCommandsList: true,
        document: `${VOTE_GITBOOK}&action=top`,
      }),
    ],
  }),
  colorType: "Server",
  aliases: ["leaderboard"],
}

export default command
