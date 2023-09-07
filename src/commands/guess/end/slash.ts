import { SlashCommandSubcommandBuilder, userMention } from "@discordjs/builders"
import mochiGuess from "adapters/mochi-guess"
import { ThreadChannel, MessageOptions, Message } from "discord.js"
import { now, truncate, groupBy } from "lodash"
import { logger } from "logger"
import moment from "moment-timezone"
import { SlashCommand } from "types/common"
import { capitalizeFirst, equalIgnoreCase } from "utils/common"
import { timeouts, timers } from ".."

import { composeEmbedMessage } from "ui/discord/embed"

export async function cleanupAfterEndGame(
  thread: ThreadChannel,
  gameCode: string,
) {
  try {
    clearTimeout(timeouts.get(gameCode))
    clearInterval(timers.get(gameCode))

    await thread.setLocked(true, "game ended")
    await thread.setArchived(true, "game ended")
  } catch (e: any) {
    logger.error(e)
    logger.warn("Cannot cleanup after game end")
  }
}

export async function announceResult(
  messageContext: ThreadChannel | Message["channel"],
  gameCode: string,
  answer: string,
  gameResult: any,
) {
  const group = groupBy(gameResult, (r) => {
    const isLoser = r.final_amount.split("").at(0) === "-"
    return isLoser ? "losers" : "winners"
  })
  group.winners ??= []
  group.losers ??= []
  const embed = composeEmbedMessage(null, {
    color: "GREEN",
  })
  embed.setTitle(`:crossed_swords: Result - ${gameCode}`)
  embed.setDescription(
    "The rewards you received include taxes and transaction fees. Please be aware when receiving rewards. Contact us if you have questions or concerns. Thank you! \n\nHere is the result:",
  )

  const winners =
    group.winners.length === 0
      ? ["No one"]
      : group.winners.map(
          (t) =>
            `> ${userMention(t.player_id)} +${t.final_amount} ${t.token_name}`,
        )

  const losers =
    group.losers.length === 0
      ? ["No one"]
      : group.losers.map(
          (t) =>
            `> ${userMention(t.player_id)} ${t.final_amount} ${t.token_name}`,
        )

  const embedFields: any[] = [
    {
      name: ":dart: Answer",
      value: `> ${answer}\n`,
      inline: false,
    },
    {
      name: ":star_struck: Winners",
      value: `${winners.join("\n")}\n`,
      inline: false,
    },
    {
      name: ":face_with_symbols_over_mouth: Losers",
      value: `${losers.join("\n")}\n`,
      inline: false,
    },
  ]

  embed.setFields(embedFields)

  const msgOpt: MessageOptions = {
    embeds: [embed],
  }

  await messageContext.send(msgOpt).catch(() => null)
}

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
          .setAutocomplete(true),
      )
      .addStringOption((opt) =>
        opt
          .setName("choice")
          .setDescription("yes/no")
          .setAutocomplete(true)
          .setRequired(true),
      )
  },
  autocomplete: async (i) => {
    const { name, value } = i.options.getFocused(true)
    if (name === "code") {
      const { ok, data: games } = await mochiGuess.getGames()
      if (!ok) {
        await i.respond([])
        return
      }
      await i.respond(
        games
          .filter((g: any) =>
            g.code.toLowerCase().includes(value.toLowerCase()),
          )
          .filter((g: any) => now() < moment(g.end_at).unix() * 1000)
          .map((g: any) => ({
            name: `${g.code} ${truncate(g.question, { length: 20 })}`,
            value: g.code,
          }))
          .slice(0, 25),
      )
    } else {
      const code = i.options.getString("code", true) || ""
      if (!code) {
        await i.respond([])
        return
      }

      const { ok, data: game } = await mochiGuess.getGameProgress(code)
      if (!ok) {
        await i.respond([])
        return
      }
      await i.respond(
        (game.options ?? []).map((opt: any) => {
          const name = opt.option?.slice(0, 100) ?? "NA" // limit choice by 100 char
          return {
            name,
            value: opt.code,
          }
        }),
      )
    }
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

    if (
      !game.options.find((opt: any) => equalIgnoreCase(opt.code, optionCode))
    ) {
      return {
        messageOptions: {
          content: "Please select one of game's option",
        },
      }
    }

    const thread = (await i.client.channels
      .fetch(game.thread_id)
      .catch(() => null)) as ThreadChannel

    if (!thread) return
    const gameResult = await mochiGuess
      .endGame(code, i.user.id, optionCode)
      .catch(() => null)
    await i.deleteReply().catch(() => null)
    if (gameResult?.data) {
      await announceResult(
        thread,
        code,
        (game.options ?? []).find((opt: any) =>
          equalIgnoreCase(optionCode, opt.code),
        )?.option ?? "NA",
        gameResult.data,
      )
    }

    await cleanupAfterEndGame(thread, code)
  },
  category: "Game",
  help: () => Promise.resolve({}),
  colorType: "Game",
}

export default slashCmd
