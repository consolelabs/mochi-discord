import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Message, MessageActionRow, MessageButton } from "discord.js"
import { SlashCommand } from "types/common"
import mochiGuess from "adapters/mochi-guess"
import { timeouts, timers } from ".."
import { truncate } from "lodash"
import { capitalizeFirst, equalIgnoreCase } from "utils/common"
import { announceResult, cleanupAfterEndGame } from "../end/slash"

function renderProgress(end: number, code: string, options: any[]) {
  const time = end <= Date.now() ? "0" : Math.round(end / 1000)
  const msg1 = `The game will be closed <t:${time}:R>.\n:warning: Please make sure you have submitted the answer and approved the mochi transaction.`
  const msg2 = `**TIME'S UP**. We hope you enjoyed the game and learned something new. 🎉`

  return [
    `:game_die: **GUESS GAME ID:** \`${code}\`\n`,
    `${time === "0" ? msg2 : msg1}`,
    "",
    ...(options ?? []).map(
      (opt: any) =>
        `${opt.option}${
          opt.payout_ratio !== "0" ? ` **${opt.payout_ratio}x**: ` : ": "
        } ${
          opt.game_player
            ? opt.game_player.map((p: any) => `<@${p.player_id}>`).join(", ")
            : ""
        }`
    ),
  ].join("\n")
}

const slashCmd: SlashCommand = {
  name: "new",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("new")
      .setDescription("new game")
      .addUserOption((opt) =>
        opt.setName("referee").setDescription("referee").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("question")
          .setDescription("a yes or no question")
          .setRequired(true)
      )
      .addIntegerOption((opt) =>
        opt
          .setName("duration")
          .setDescription(
            "duration to run the game in minutes (default 30 minutes)"
          )
          .setMaxValue(60)
          .setMinValue(1)
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName("yes_label")
          .setDescription("the label for yes option (optional)")
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName("no_label")
          .setDescription("the label for no option (optional)")
          .setRequired(false)
      )
  },
  run: async (i) => {
    if (i.channel?.type !== "GUILD_TEXT") {
      return {
        messageOptions: {
          content: "Please ask a question inside a text channel (non-thread)",
        },
      }
    }
    const yesLabel = `${
      i.options.getString("yes_label", false) || "🐮 Bullish"
    }`
    const noLabel = `${i.options.getString("no_label", false) || "🐻 Bearish"}`
    const question = i.options.getString("question", true)
    const durationMin = i.options.getInteger("duration", false) || 30
    const durationMs = durationMin * 60 * 1000
    const referee = i.options.getUser("referee", true)

    if (i.user.id === referee.id) {
      return {
        messageOptions: {
          content: "You cannot promote yourself to referee",
        },
      }
    }

    const reply = (await i.editReply({
      content: [`${i.user} asked:`, `> ${question}`].join("\n"),
    })) as Message

    const thread = await reply.startThread({
      name: truncate(question, { length: 100 }),
    })
    thread.members.add(referee)

    const game = {
      duration: durationMin,
      host_id: i.user.id,
      options: [yesLabel, noLabel],
      question,
      referee_id: referee.id,
      thread_id: thread.id,
    }
    const { ok, data, originalError, error } = await mochiGuess.createGame(game)
    if (!ok) {
      return {
        messageOptions: {
          content: capitalizeFirst(originalError || error),
        },
      }
    }
    const start = Date.now(),
      end = start + durationMs
    const updatePlayers = async function () {
      const { ok, data: game } = await mochiGuess.getGameProgress(data.code)
      if (!ok) return
      const options = game.options

      msg
        .edit({
          content: renderProgress(end, data.code, options),
        })
        .catch(() => null)
    }

    const yesCode = data.options.find((opt: any) =>
      equalIgnoreCase(opt.option, yesLabel)
    ).code
    const noCode = data.options.find((opt: any) =>
      equalIgnoreCase(opt.option, noLabel)
    ).code

    const choices = [
      new MessageActionRow().addComponents(
        new MessageButton({
          label: yesLabel,
          style: "SECONDARY",
          customId: yesCode,
        }),
        new MessageButton({
          label: noLabel,
          style: "SECONDARY",
          customId: noCode,
        })
      ),
    ]

    const options: Record<string, string> = {
      [yesCode]: yesLabel,
      [noCode]: noLabel,
    }

    timeouts.set(
      data.code,
      setTimeout(async () => {
        await updatePlayers()
        const msg = await thread
          .send({
            content: `Hey ${referee}, time is up — please submit your result`,
            components: choices,
          })
          .catch(() => null)

        msg
          ?.createMessageComponentCollector({
            componentType: "BUTTON",
            // 10 minutes to decide
            time: 10 * 60 * 1000,
          })
          .on("collect", async (i) => {
            await i.deferReply({ ephemeral: true }).catch(() => null)
            if (i.user.id !== referee.id) {
              await i.editReply({
                content: "Only referee can decide the result of this game",
              })
              return
            }

            await i.update({ components: [] }).catch(() => null)

            const gameResult = await mochiGuess
              .endGame(data.code, i.user.id, i.customId)
              .catch(() => null)
            await i.deleteReply().catch(() => null)
            if (gameResult?.data) {
              await announceResult(
                thread,
                options[i.customId as keyof typeof options],
                gameResult.data
              )
            }

            await cleanupAfterEndGame(thread, data.code)
          })
      }, durationMs + 30 * 1000) // + more 30s to make sure all transactions are comitted
    )

    const msg = await thread.send({
      content: renderProgress(end, data.code, data.options),
      components: choices,
    })

    timers.set(data.code, setInterval(updatePlayers, 10 * 1000))

    msg
      .createMessageComponentCollector({
        componentType: "BUTTON",
        time: durationMs,
      })
      .on("collect", async (i) => {
        await i.deferReply({ ephemeral: true }).catch(() => null)
        if (i.user.id === referee.id) {
          await i.editReply({
            content: "Referee cannot play",
          })
          return
        }
        const optionCode = i.customId

        const { ok, error } = await mochiGuess.joinGame(
          data.code,
          i.user.id,
          optionCode
        )
        if (!ok) {
          await i.editReply({
            content: capitalizeFirst(error),
          })
          return
        }

        await i.editReply({
          content: `A join request has been sent to you. Please check your DM.`,
        })
      })
  },
  category: "Game",
  help: () => Promise.resolve({}),
  colorType: "Game",
}

export default slashCmd
