import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import mochiGuess from "adapters/mochi-guess"
import { truncate } from "lodash"
import moment, { now } from "moment-timezone"
import { SlashCommand } from "types/common"

const slashCmd: SlashCommand = {
  name: "choice",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("choice")
      .setDescription("submit your choice")
      .addStringOption((opt) =>
        opt
          .setName("code")
          .setDescription("game id")
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("choice")
          .setDescription("yes or no")
          .setChoices([
            ["yes", "1"],
            ["no", "2"],
          ])
          .setRequired(true)
      )
  },
  autocomplete: async (i) => {
    const { ok, data: games } = await mochiGuess.getGames()
    const input = i.options.getFocused()
    if (!ok) {
      await i.respond([])
      return
    }

    await i.respond(
      games
        .filter((g: any) => g.code.toLowerCase().includes(input.toLowerCase()))
        .filter((g: any) => now() < moment(g.end_at).unix() * 1000)
        .map((g: any) => ({
          name: `${g.code} ${truncate(g.question, { length: 20 })}`,
          value: g.code,
        }))
        .slice(0, 25)
    )
  },
  run: async (i) => {
    const code = i.options.getString("code", true)
    const optionCode = i.options.getString("choice", true)
    const { ok, status, data: game } = await mochiGuess.getGameProgress(code)
    if (status === 404)
      return {
        messageOptions: {
          content: "No game found",
        },
      }
    if (!ok) throw new Error()

    if (!game)
      return {
        messageOptions: {
          content: "No game found",
        },
      }

    if (game.referee_id === i.user.id) {
      return {
        messageOptions: {
          content: "Referee can't play",
        },
      }
    }

    await mochiGuess.joinGame(game.id, i.user.id, optionCode)

    await i.editReply({
      content: `A join request has been sent to you. Please check your inbox.`,
    })
  },
  category: "Game",
  help: () => Promise.resolve({}),
  colorType: "Game",
}

export default slashCmd
