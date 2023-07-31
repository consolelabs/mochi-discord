import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import mochiGuess from "adapters/mochi-guess"
import { ThreadChannel } from "discord.js"
import { truncate } from "lodash"
import { SlashCommand } from "types/common"
import { capitalizeFirst, equalIgnoreCase } from "utils/common"
import { timeouts, timers } from ".."

const slashCmd: SlashCommand = {
  name: "end",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("end")
      .setDescription("end the game")
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
          .setDescription("bullish/bearish")
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
    const {
      ok,
      status,
      data: game,
      originalError,
      error,
    } = await mochiGuess.getGameProgress(code)
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

    if (!game)
      return {
        messageOptions: {
          content: "No game found",
        },
      }

    const thread = (await i.client.channels.fetch(
      game.thread_id
    )) as ThreadChannel

    await thread.send({
      content: [`Time is up!`].join("\n"),
    })

    clearTimeout(timeouts.get(game.code))
    clearInterval(timers.get(game.code))

    await mochiGuess.endGame(game.code, i.user.id, optionCode)

    const options = game.options.map((opt: any) => {
      const players = opt.game_player.map(
        (player: any) => `<@${player.player_id}>`
      )
      return `${opt.option}: ${players.join(", ")}`
    })

    await thread.setArchived(true, "game ended").catch(() => null)
    await thread.setLocked(true, "game ended").catch(() => null)

    return {
      messageOptions: {
        content: [
          `> ${game.question}`,
          ...options,
          "",
          `The answer is: ${
            game.options.find((opt: any) =>
              equalIgnoreCase(optionCode, opt.code)
            ).option
          }`,
        ].join("\n"),
      },
    }
  },
  category: "Game",
  help: () => Promise.resolve({}),
  colorType: "Game",
}

export default slashCmd
