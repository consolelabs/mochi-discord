import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { DOT, PREFIX, VOTE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

const command: Command = {
  id: "poe_twitter_stats",
  command: "stats",
  brief: "View twitter leaderboard",
  category: "Config",
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    let page = args.length > 1 ? +args[1] : 0
    page = Math.max(isNaN(page) ? 0 : page - 1, 0)
    const {
      curl,
      log,
      ok,
      data: _data,
    } = await config.getTwitterLeaderboard({
      guild_id: msg.guild.id,
      page,
    })

    if (!ok) {
      throw new APIError({ curl, description: log, message: msg })
    }

    const data = _data?.data ?? []

    const handles = data.map((d: any) => {
      return `\`${DOT} ${d.twitter_handle}    =>\``
    })

    const longestHandle =
      handles.sort((a: string, b: string) => b.length - a.length)[0]?.length ??
      0

    const formattedHandles = data.map((d: any) => {
      return `\`${DOT} ${d.twitter_handle}${Array(
        longestHandle - 6 - d.twitter_handle.length
      )
        .fill(" ")
        .join("")}=>\``
    })

    const topScore = data[0]?.total_count ?? 0
    const topDigits = topScore.toString().length

    const formattedScores = data.map((d: any) => {
      return `\`${Array(topDigits - d.total_count.toString().length)
        .fill(" ")
        .join("")}${d.total_count}\``
    })

    return {
      messageOptions: {
        content: `__Top 10 Twitter users__:\n${formattedHandles
          .map((fh: string, i: number) => {
            return `${fh} ${formattedScores[i]}`
          })
          .join("\n")}`,
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
