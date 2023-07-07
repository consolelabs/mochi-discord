import { BalanceType } from "commands/balances/index/processor"
import { machineConfig as balanceMachineConfig } from "commands/balances/index/slash"
import { render as renderTrackingWallets } from "commands/wallet/list/processor"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import { MachineConfig, route, RouterSpecialAction } from "utils/router"

import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

import { composeEcocal } from "./processor"

export const machineConfig: (ctx?: any) => MachineConfig = (context = {}) => ({
  id: "ecocal",
  initial: "ecocal",
  context: {
    button: {
      ecocal: (i, _ev, ctx) => composeEcocal(i.user, ctx.page),
    },
    ...context,
  },
  states: {
    ecocal: {
      on: {
        [RouterSpecialAction.NEXT_PAGE]: "ecocal",
        [RouterSpecialAction.PREV_PAGE]: "ecocal",
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
      .setDescription("View economic calendar")
  },
  run: async function (i: CommandInteraction) {
    const { context, msgOpts } = await composeEcocal(i.user, 0)
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
  colorType: "Defi",
}

export default command
