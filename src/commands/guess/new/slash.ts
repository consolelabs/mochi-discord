import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Message, MessageActionRow, MessageButton, User } from "discord.js"
import { SlashCommand } from "types/common"
import mochiGuess from "adapters/mochi-guess"
import { timeouts, timers } from ".."
import { truncate } from "lodash"
import { capitalizeFirst, equalIgnoreCase } from "utils/common"

function renderProgress(
  referee: User,
  end: number,
  code: string,
  options: any[]
) {
  const time = end <= Date.now() ? Date.now() : Math.round(end / 1000)
  return [
    `<@${referee.id}> to provide answer <t:${time}:R>, id: \`${code}\``,
    "",
    ...(options ?? []).map(
      (opt: any) =>
        `${opt.option}: ${
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
            "duration to run the game in minutes (default 30mins)"
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
    } (yes)`
    const noLabel = `${
      i.options.getString("no_label", false) || "🐻 Bearish"
    } (no)`
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
          content: renderProgress(referee, end, data.code, options),
        })
        .catch(() => null)
    }
    timeouts.set(
      data.code,
      setTimeout(async () => {
        await updatePlayers()
        thread
          .send({
            content: `Hey ${referee}, time is up — please submit your result`,
          })
          .catch(() => null)
      }, durationMs)
    )
    const msg = await thread.send({
      content: renderProgress(referee, end, data.code, data.options),
      components: [
        new MessageActionRow().addComponents(
          new MessageButton({
            label: yesLabel,
            style: "SECONDARY",
            customId: data.options.find((opt: any) =>
              equalIgnoreCase(opt.option, yesLabel)
            ).code,
          }),
          new MessageButton({
            label: noLabel,
            style: "SECONDARY",
            customId: data.options.find((opt: any) =>
              equalIgnoreCase(opt.option, noLabel)
            ).code,
          })
        ),
      ],
    })

    timers.set(data.code, setInterval(updatePlayers, 60 * 1000))

    msg
      .createMessageComponentCollector({
        filter: (ci) => ci.user.id !== referee.id,
        componentType: "BUTTON",
        time: durationMs,
      })
      .on("collect", async (i) => {
        await i.deferReply({ ephemeral: true })
        if (i.user.id === referee.id) {
          await i.editReply({
            content: "Referee cannot play",
          })
          return
        }
        if (Date.now() >= end) {
          await i.editReply({
            content: "No more time to vote or game already ended",
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
        const dmChannel = await i.user.createDM(true).catch(() => null)
        await i.editReply({
          content: `A join request has been sent to your DM${
            dmChannel ? `, <#${dmChannel.id}>` : ""
          }`,
        })
      })
  },
  category: "Game",
  help: () => Promise.resolve({}),
  colorType: "Game",
}

export default slashCmd
