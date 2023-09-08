import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { airdropDetail, setAirdropStatus } from "../available/processor"
import { run } from "./processor"
import { CommandInteraction, Message } from "discord.js"
import { MachineConfig, RouterSpecialAction, route } from "utils/router"

export const machineConfig: (ctx: any) => MachineConfig = (context) => ({
  id: "drop search",
  initial: "searchAirdrops",
  context: {
    button: {
      searchAirdrops: (i, ev, ctx) => {
        let page = 0
        if (
          ev === RouterSpecialAction.NEXT_PAGE ||
          ev === RouterSpecialAction.PREV_PAGE
        )
          page = ctx.page

        return run(i.user.id, ctx.keyword, page)
      },
    },
    select: {
      airdrop: (i) => airdropDetail(i),
      userAirdropStatus: (i, _ev, ctx) => setAirdropStatus(i, ctx),
    },
    ...context,
  },
  states: {
    searchAirdrops: {
      on: {
        VIEW_AIRDROP_DETAIL: "airdrop",
        VIEW_LIVE: "searchAirdrops",
        VIEW_ENDED: "searchAirdrops",
        VIEW_IGNORED: "searchAirdrops",
        // special, reserved event name
        NEXT_PAGE: "searchAirdrops",
        PREV_PAGE: "searchAirdrops",
      },
    },
    airdrop: {
      on: {
        BACK: "searchAirdrops",
        SET_AIRDROP_STATUS: "userAirdropStatus",
      },
    },
    userAirdropStatus: {
      on: {
        BACK: "searchAirdrops",
        SET_AIRDROP_STATUS: "userAirdropStatus",
      },
    },
  },
})

export const slashCmd: SlashCommand = {
  name: "search",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("search")
      .setDescription("search airdrop campaigns")
      .addStringOption((opt) =>
        opt
          .setName("keyword")
          .setDescription("search content, title, or id with prefix *#*")
          .setRequired(true),
      )

    return data
  },
  run: async function (interaction: CommandInteraction) {
    const keyword = interaction.options.getString("keyword", false) ?? undefined

    const { context, msgOpts } = await run(interaction.user.id, keyword)

    const reply = (await interaction.editReply(msgOpts)) as Message

    route(reply, interaction, machineConfig(context))
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}
