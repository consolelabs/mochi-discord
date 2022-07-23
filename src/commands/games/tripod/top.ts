import { Message } from "discord.js"
import { Command } from "types/common"
import { drawLeaderboard } from "utils/canvas"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import GameSessionManager from "utils/GameSessionManager"

const command: Command = {
  id: "tripod_top",
  command: "top",
  brief: "Show top 10 players of Tripod",
  category: "Game",
  run: async function (msg: Message) {
    const { allData, leaderboard } = await GameSessionManager.getPoints()
    const authorPts = allData[msg.author.id]

    const blank = getEmoji("blank")
    const embed = composeEmbedMessage(msg, {
      title: `${getEmoji("cup")} ${msg.guild.name}'s Tripod rankings`,
      thumbnail:
        "https://media.discordapp.net/attachments/984660970624409630/999237981250539650/tripod-logo.png",
      description: `${blank}**Your Points:** ${
        authorPts?.pts ?? 0
      }\n\u200B\n\u200B`,
      image: "attachment://leaderboard.png",
    })

    return {
      messageOptions: {
        embeds: [embed],
        files: [
          await drawLeaderboard({
            rows: leaderboard.map((d: any) => ({
              username: d.username,
              discriminator: d.discriminator,
              rightValue: d.pts,
            })),
            leftHeader: "Players",
            rightHeader: "Pts",
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tripod top`,
        examples: `${PREFIX}tripod top`,
      }),
    ],
  }),
  canRunWithoutAction: false,
  colorType: "Game",
}

export default command
