import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import mochiGuess from "adapters/mochi-guess"
import { truncate } from "lodash"
import { SlashCommand } from "types/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import moment, { now } from "moment-timezone"

const formatGame = (data: any[]) =>
  data.length
    ? formatDataTable(
        data.map((g) => ({
          question: truncate(g.question, { length: 20 }),
          playerCount: `${g.options.reduce(
            (acc: number, c: any) =>
              (acc += c.game_player ? c.game_player.length : 0),
            0
          )}P`,
        })),
        {
          cols: ["question", "playerCount"],
          rowAfterFormatter: (f, i) => `${f} <#${data[i].thread_id}>`,
        }
      ).joined
    : "There are no games, yet"

const slashCmd: SlashCommand = {
  name: "list",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("view existing games")
  },
  run: async () => {
    const allGames = {
      running: [] as any[],
      ended: [] as any[],
    }

    const { data, ok } = await mochiGuess.getGames()

    if (ok) {
      const sorted = data.sort(
        (a: any, b: any) =>
          moment(b.start_at).unix() - moment(a.start_at).unix()
      )
      for (const g of sorted as any[]) {
        if (now() >= moment(g.end_at).unix() * 1000) {
          allGames.ended.push(g)
        } else {
          allGames.running.push(g)
        }
      }
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["List games", getEmojiURL(emojis.MOCHI_CIRCLE)],
            description: [
              `📍 Running\n${formatGame(allGames.running.slice(0, 20))}`,
              `☑️ Ended\n${formatGame(allGames.ended.slice(0, 3))}`,
            ].join(`\n${getEmoji("LINE").repeat(5)}\n`),
          }),
        ],
      },
    }
  },
  category: "Game",
  help: () => Promise.resolve({}),
  colorType: "Game",
}

export default slashCmd
