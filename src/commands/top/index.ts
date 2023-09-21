import { SlashCommand } from "types/common"
import { SLASH_PREFIX, VERTICAL_BAR } from "utils/constants"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { SlashCommandBuilder } from "@discordjs/builders"
import { MachineConfig, route } from "utils/router"
import api from "api"
import UI, { Platform, utils } from "@consolelabs/mochi-ui"
import { getEmoji, thumbnails } from "utils/common"
import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"

const machineConfig: MachineConfig = {
  id: "leaderboard",
  initial: "leaderboard",
  context: {
    button: {
      leaderboard: (i, ev) => {
        ev ||= "alltime"
        return render(i as any, ev.toLowerCase())
      },
    },
  },
  states: {
    leaderboard: {
      on: {
        LEADERBOARD: "leaderboard",
        ALLTIME: "leaderboard",
        WEEKLY: "leaderboard",
        MONTHLY: "leaderboard",
      },
    },
  },
}

let pos: Array<string> = []

async function render(i: CommandInteraction, timerange: any) {
  if (!pos.length) {
    pos = [
      getEmoji("ANIMATED_BADGE_3"),
      getEmoji("ANIMATED_BADGE_1"),
      getEmoji("ANIMATED_BADGE_2"),
      ...Array(7).fill(getEmoji("BLANK")),
    ]
  }
  const { ok, data: leaderboard } = await api.pay.users.getLeaderboard(
    timerange,
  )
  if (!ok) throw new Error("Couldn't get leaderboard data")

  const topSender = await Promise.all(
    leaderboard.top_sender.map(async (d: any) => {
      const [name] = await UI.resolve(Platform.Discord, d.profile.id)

      return {
        name: name?.value ?? "",
        usd: utils.formatUsdDigit(d.usd_amount),
      }
    }),
  )

  const topReceiver = await Promise.all(
    leaderboard.top_receiver.map(async (d: any) => {
      const [name] = await UI.resolve(Platform.Discord, d.profile.id)

      return {
        name: name?.value ?? "",
        usd: utils.formatUsdDigit(d.usd_amount),
      }
    }),
  )

  const sender = utils.mdTable(topSender, {
    cols: ["usd", "name"],
    wrapCol: [true, false],
    alignment: ["right", "left"],
    row: (f, i) => `${pos[i]}${VERTICAL_BAR}${f}`,
  })

  const receiver = utils.mdTable(topReceiver, {
    cols: ["usd", "name"],
    wrapCol: [true, false],
    alignment: ["right", "left"],
    row: (f, i) => `${pos[i]}${VERTICAL_BAR}${f}`,
  })

  let timePhrase = ""
  let leaderboardTitle = ""
  switch (timerange) {
    case "weekly":
      timePhrase = "in the last 7d"
      leaderboardTitle = "Weekly"
      break
    case "monthly":
      timePhrase = "in the last 30d"
      leaderboardTitle = "Monthly"
      break
    case "alltime":
    default:
      timePhrase = "since Mochi was born"
      break
  }

  const lines = []
  lines.push(getEmoji("BLANK"))
  lines.push(`**🚀 Top 10 senders**`)

  if (sender.length == 0) {
    lines.push("There are no outstanding senders, yet\\.")
  } else {
    lines.push(sender)
  }

  lines.push(getEmoji("BLANK"))
  lines.push(`**🎯 Top 10 receivers**`)
  if (receiver.length == 0) {
    lines.push("There are no outstanding receivers, yet\\.")
  } else {
    lines.push(receiver)
  }
  lines.push(getEmoji("BLANK"))

  lines.push(`_This data is recorded ${timePhrase}_`)

  const embed = composeEmbedMessage2(i as any, {
    author: [`🏆 ${leaderboardTitle} Tip Leaderboard`, thumbnails.MOCHI],
    description: lines.join("\n"),
  })

  return {
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton({
            label: "All time",
            customId: "ALLTIME",
            style: "SECONDARY",
            disabled: timerange === "alltime",
          }),
          new MessageButton({
            label: "Weekly",
            customId: "WEEKLY",
            style: "SECONDARY",
            disabled: timerange === "weekly",
          }),
          new MessageButton({
            label: "Monthly",
            customId: "MONTHLY",
            style: "SECONDARY",
            disabled: timerange === "monthly",
          }),
        ),
      ],
    },
  }
}

const slashCmd: SlashCommand = {
  name: "top",
  category: "Community",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("top")
      .setDescription("Show top senders and receivers")
      .addStringOption((opt) =>
        opt
          .setName("timerange")
          .setDescription("View data in certain timeranges")
          .setChoices([
            ["weekly", "weekly"],
            ["monthly", "monthly"],
            ["alltime", "alltime"],
          ])
          .setRequired(false),
      )
  },
  run: async function (i) {
    const timerange = i.options.getString("timerange", false) ?? "alltime"

    const { msgOpts } = await render(i, timerange)

    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig)
  },
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          usage: `${SLASH_PREFIX}top [page]`,
          examples: `${SLASH_PREFIX}top\n${SLASH_PREFIX}top 2`,
        }),
      ],
    }),
  colorType: "Server",
}

export default { slashCmd }
