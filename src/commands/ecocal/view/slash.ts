import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import { MachineConfig, route } from "utils/router"

import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

import { composeEcocal } from "./processor"

export const machineConfig: (ctx?: any) => MachineConfig = (context = {}) => ({
  id: "ecocal",
  initial: "ecocal",
  context: {
    button: {
      ecocal: (i, ev, ctx) => {
        if (ev == "TODAY") {
          ctx.dateNumber = 0
        }
        if (ev == "NEXT_DATE") {
          if (ctx.dateNumber <= 30) {
            ctx.dateNumber++
          }
        }
        if (ev == "PREV_DATE") {
          if (ctx.dateNumber >= -30) {
            ctx.dateNumber--
          }
        }

        if (ev == "ALL_IMPACT") {
          ctx.impact = "1|2|3|Holiday"
        }

        if (ev == "LOW_IMPACT") {
          ctx.impact = "1"
        }

        if (ev == "MEDIUM_IMPACT") {
          ctx.impact = "2"
        }

        if (ev == "HIGH_IMPACT") {
          ctx.impact = "3"
        }

        return composeEcocal(i.user, ctx.dateNumber, ctx.impact)
      },
    },
    dateNumber: 0,
    impact: "1|2|3|Holiday",
    ...context,
  },
  states: {
    ecocal: {
      on: {
        NEXT_DATE: "ecocal",
        TODAY: "ecocal",
        PREV_DATE: "ecocal",
        LOW_IMPACT: "ecocal",
        MEDIUM_IMPACT: "ecocal",
        HIGH_IMPACT: "ecocal",
        ALL_IMPACT: "ecocal",
      },
    },
  },
})

const command: SlashCommand = {
  name: "view",
  category: "Defi",
  prepare: (alias = "view") => {
    return new SlashCommandSubcommandBuilder()
      .setName(alias)
      .setDescription("View Economic Calendar")
  },
  run: async function (i: CommandInteraction) {
    const { context, msgOpts } = await composeEcocal(i.user, 0, "1|2|3|Holiday")
    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig(context))
  },
  help: (interaction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          thumbnail: thumbnails.TOKENS,
          title: "Show list of economic calendars",
          description: `Data is fetched from [Mochi](https://mochi.gg/)`,
          usage: `${SLASH_PREFIX}ecocal view`,
          examples: `${SLASH_PREFIX}ecocal view`,
        }),
      ],
    }),
  colorType: "Market",
}

export default command
