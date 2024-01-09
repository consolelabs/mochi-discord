import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  User,
} from "discord.js"
import { SlashCommand } from "types/common"
import mochiGuess from "adapters/mochi-guess"
import { timeouts, timers } from ".."
import {
  capitalizeFirst,
  equalIgnoreCase,
  getEmojiToken,
  TokenEmojiKey,
} from "utils/common"
import { announceResult, cleanupAfterEndGame } from "../end/slash"
import { composeEmbedMessage, enableDMMessage } from "../../../ui/discord/embed"
import { truncate } from "lodash"
import moment, { now } from "moment-timezone"
import { formatTokenDigit } from "utils/defi"

function collectPlayerChoice(data: any, referee: User) {
  return async function (i: ButtonInteraction) {
    await i.deferReply({ ephemeral: true }).catch(() => null)
    if (i.user.id === referee.id) {
      await i.editReply({
        content: "Referee cannot play",
      })
      return
    }

    i.user
      .send("A join request should open up shortly...")
      .then(async () => {
        const optionCode = i.customId

        const { ok, error } = await mochiGuess.joinGame(
          data.code,
          i.user.id,
          optionCode,
        )
        if (!ok) {
          await i.editReply({
            content: capitalizeFirst(error),
          })
          return
        }

        const dmChannel = await i.user.createDM(true).catch(() => null)
        await i.editReply({
          content: `A join request has been sent to you. Please check your DM${
            dmChannel ? `, <#${dmChannel.id}>` : ""
          }.`,
        })
      })
      .catch(() => {
        i.editReply({ embeds: [enableDMMessage()] })
      })
  }
}

function renderProgress(
  referee: User,
  question: string,
  end: number,
  code: string,
  options: any[],
  bet_default_value: number,
  token_name: string,
): MessageEmbed {
  const time = end <= Date.now() ? "0" : Math.round(end / 1000)
  const msg1 = `:warning: The game will be closed **<t:${time}:R>**.\nPlease ensure that you have **approved** the mochi transaction.`
  const msg2 = `**:hourglass:TIME'S UP**. We hope you enjoyed the game and learned something new. 🎉`

  const embed = composeEmbedMessage(null, {
    color: "GREEN",
  })

  const embedFields: any[] = (options ?? []).map((opt: any) => {
    const players = opt.game_player
      ? opt.game_player.map((p: any) => `<@${p.player_id}>`).join(", ")
      : ""
    return {
      name: `${opt.option} ${
        opt.payout_ratio !== "0"
          ? `- ***${opt.payout_ratio}x Payout*** : `
          : ": "
      }`,
      value: `${players === "" ? "-" : players}`,
      inline: false,
    }
  })

  embed.setTitle(":video_game: **GUESS GAME**")
  embed.setDescription(
    [
      `:question:**Question**`,
      `> ${question}`,
      "",
      `:game_die: \`ID.         \` **${code}**`,
      `:police_officer: \`Referee.    \` <@${referee.id}>`,
      `:moneybag: \`Bet Amount. \` ${getEmojiToken(
        token_name as TokenEmojiKey,
        false,
      )} **${formatTokenDigit(bet_default_value)} ${token_name}**`,
      "",
      `${time === "0" ? msg2 : msg1}`,
    ].join("\n"),
  )

  embed.setFields(embedFields)

  return embed
}

const slashCmd: SlashCommand = {
  name: "new",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("new")
      .setDescription("new game")
      .addUserOption((opt) =>
        opt.setName("referee").setDescription("referee").setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName("question")
          .setDescription("a yes or no question")
          .setRequired(true),
      )
      .addIntegerOption((opt) =>
        opt
          .setName("duration")
          .setDescription(
            "duration to run the game in minutes (default 30 minutes)",
          )
          .setMaxValue(4320)
          .setMinValue(1)
          .setRequired(false),
      )
      .addStringOption((opt) =>
        opt
          .setName("yes_label")
          .setDescription("the label for yes option (optional)")
          .setRequired(false),
      )
      .addStringOption((opt) =>
        opt
          .setName("no_label")
          .setDescription("the label for no option (optional)")
          .setRequired(false),
      )
      .addNumberOption((opt) =>
        opt
          .setName("bet_amount")
          .setDescription("game bet amount (default: 1, max: 5 )")
          .setMinValue(0.01)
          .setMaxValue(10)
          .setRequired(false),
      )
      .addBooleanOption((opt) =>
        opt
          .setName("thread")
          .setDescription("game played in thread (default false)")
          .setRequired(false),
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
    const bet_default_value = i.options.getNumber("bet_amount", false) || 0

    if (i.user.id === referee.id) {
      return {
        messageOptions: {
          content: "You cannot promote yourself to referee.",
        },
      }
    }

    const threadMode = i.options.getBoolean("thread", false)

    const reply = (await i.editReply({
      content: [`Hey @here, ${i.user}'s popped new Quiz.`].join("\n"),
    })) as Message

    let messageContext: any = reply.channel
    let flowID = reply.channel.id
    if (threadMode) {
      const thread = await reply.startThread({
        name: truncate(question, { length: 100 }),
      })
      await thread.members.add(referee)
      messageContext = thread
      flowID = thread.id
    }

    const game = {
      duration: durationMin,
      host_id: i.user.id,
      options: [yesLabel, noLabel],
      question,
      referee_id: referee.id,
      thread_id: flowID,
      bet_default_value,
    }
    const { ok, data, originalError, error } = await mochiGuess.createGame(game)
    if (!ok) {
      return {
        messageOptions: {
          content: capitalizeFirst(originalError || error),
        },
      }
    }

    const yesCode = data.options.find((opt: any) =>
      equalIgnoreCase(opt.option, yesLabel),
    ).code
    const noCode = data.options.find((opt: any) =>
      equalIgnoreCase(opt.option, noLabel),
    ).code

    const options: Record<string, string> = {
      [yesCode]: yesLabel,
      [noCode]: noLabel,
    }

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
        }),
      ),
    ]

    const start = Date.now(),
      end = start + durationMs
    const updatePlayers = async function () {
      const { ok, data: game } = await mochiGuess.getGameProgress(data.code)
      if (!ok) return
      const options = game.options

      msg
        .edit({
          embeds: [
            renderProgress(
              referee,
              question,
              end,
              data.code,
              options,
              data.bet_default_value,
              data.token_name,
            ),
          ],
        })
        .catch(() => null)

      // buffer 30s more to ensure all transactions are committed
      if (now() >= moment(game.end_at).unix() * 1000 + 30 * 1000) {
        clearInterval(timers.get(game.code))
        return
      }
    }

    const msg = await messageContext.send({
      embeds: [
        renderProgress(
          referee,
          question,
          end,
          data.code,
          data.options,
          data.bet_default_value,
          data.token_name,
        ),
      ],
      components: choices,
    })

    timeouts.set(
      data.code,
      setTimeout(
        async () => {
          await updatePlayers()
          const embed = composeEmbedMessage(null, {
            color: "BLUE",
          })
          embed.setTitle(`:loudspeaker: Judgement - ${data.code}`)
          embed.setDescription(
            [
              `Hey ${referee}, time is up:hourglass:`,
              "",
              `:question:**Question**`,
              `> ${question}`,
              "",
              `***Please submit the game result to decide the winners of the game.***`,
            ].join("\n"),
          )

          const msg = await messageContext
            .send({
              embeds: [embed],
              components: choices,
            })
            .catch(() => null)

          msg
            ?.createMessageComponentCollector({
              componentType: "BUTTON",
              // 10 minutes to decide
              time: 10 * 60 * 1000,
            })
            .on("collect", async (i: any) => {
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
                  messageContext,
                  data.code,
                  options[i.customId as keyof typeof options],
                  gameResult.data,
                )
              }

              if (threadMode) {
                await cleanupAfterEndGame(messageContext, data.code)
              }
            })
        },
        durationMs + 30 * 1000,
      ), // + more 30s to make sure all transactions are committed
    )

    timers.set(data.code, setInterval(updatePlayers, 10 * 1000))

    if (threadMode) {
      const embed = composeEmbedMessage(null, {
        color: "GREEN",
      })
      embed.setTitle(":video_game: **GUESS GAME**")
      embed.setDescription(
        [`${i.user} asked:`, `:question:**Question**`, `> ${question}`].join(
          "\n",
        ),
      )
      const editedReply = await reply
        .edit({
          embeds: [embed],
          components: choices,
        })
        .catch(() => null)

      editedReply
        ?.createMessageComponentCollector({
          componentType: "BUTTON",
          time: durationMs,
        })
        .on("collect", collectPlayerChoice(data, referee))
    }

    msg
      .createMessageComponentCollector({
        componentType: "BUTTON",
        time: durationMs,
      })
      .on("collect", collectPlayerChoice(data, referee))
  },
  category: "Game",
  help: () => Promise.resolve({}),
  colorType: "Game",
}

export default slashCmd
