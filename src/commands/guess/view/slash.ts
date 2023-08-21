import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import mochiGuess from "adapters/mochi-guess"
import { truncate } from "lodash"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { capitalizeFirst, emojis, getEmoji, getEmojiURL } from "utils/common"

const slashCmd: SlashCommand = {
  name: "view",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("view")
      .setDescription("view game detail")
      .addStringOption((opt) =>
        opt
          .setName("code")
          .setDescription("game id")
          .setRequired(true)
          .setAutocomplete(true)
      )
  },
  autocomplete: async (i) => {
    const { ok, data: games } = await mochiGuess.getGames()
    if (!ok) {
      await i.respond([])
      return
    }

    const input = i.options.getFocused()

    await i.respond(
      games
        .filter((g: any) => g.code.toLowerCase().includes(input.toLowerCase()))
        .map((g: any) => ({
          name: `${g.code} ${truncate(g.question, { length: 20 })}`,
          value: g.code,
        }))
        .slice(0, 25)
    )
  },
  run: async (i) => {
    const code = i.options.getString("code", true)
    const {
      ok,
      status,
      originalError,
      error,
      data: game,
    } = await mochiGuess.getGame(code)
    if (status === 404)
      return {
        messageOptions: {
          content: "No game found",
        },
      }
    if (!ok) {
      return {
        messageOptions: {
          content: capitalizeFirst(originalError || error),
        },
      }
    }

    if (!game) {
      return {
        messageOptions: {
          content: "No game found",
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Game detail", getEmojiURL(emojis.MOCHI_CIRCLE)],
            description: [
              `\`ID.         \`${game.code}`,
              `\`Author.     \`<@${game.host_id}>`,
              `\`Referee.    \`<@${game.referee_id}>`,
              `\`Question.   \`${game.question}`,
              "",
              game.players
                .sort(
                  (a: any, b: any) =>
                    Number(b.collected_amount) - Number(a.collected_amount)
                )
                .map((p: any) => {
                  const isPos = Math.sign(Number(p.result)) > 0
                  return `<@${p.player_id}> **${
                    isPos ? `+${p.collected_amount}` : p.result
                  } ICY** (${getEmoji(isPos ? "ARROW_UP" : "ARROW_DOWN")}${
                    isPos ? `x${p.payout_ratio}` : ""
                  })`
                })
                .join("\n"),
              getEmoji("LINE").repeat(5),
              ...(game.result?.code
                ? [`Answer is ${game.result?.option ?? "NA"}`]
                : []),
            ].join("\n"),
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
