import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { SlashCommandBuilder } from "@discordjs/builders"
import { MachineConfig, route } from "utils/router"
import api from "api"
import UI, { Platform } from "@consolelabs/mochi-formatter"
import { thumbnails } from "utils/common"
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

async function render(i: CommandInteraction, timerange: any) {
  const { title, text } = await UI.components.top({
    timerange,
    api,
    on: Platform.Discord,
  })

  const embed = composeEmbedMessage2(i as any, {
    author: [title, thumbnails.MOCHI],
    description: text,
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
  prepare: (aliasName = "top") => {
    return new SlashCommandBuilder()
      .setName(aliasName)
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
          usage: `${SLASH_PREFIX}top`,
          examples: `${SLASH_PREFIX}top`,
        }),
      ],
    }),
  colorType: "Server",
}

export default { slashCmd }
