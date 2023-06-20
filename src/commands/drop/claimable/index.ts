import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { run, airdropDetail, setAirdropStatus } from "./processor"
import { CommandInteraction, Message } from "discord.js"
import { MachineConfig, RouterSpecialAction, route } from "utils/router"
import { AirdropCampaignStatus } from ".."

export const machineConfig: (ctx: any) => MachineConfig = (context) => ({
  id: "drop claimable",
  initial: "claimableAirdrops",
  context: {
    button: {
      claimableAirdrops: (i, ev, ctx) => {
        let page = 0
        if (
          ev === RouterSpecialAction.NEXT_PAGE ||
          ev === RouterSpecialAction.PREV_PAGE
        )
          page = ctx.page

        return run(i.user.id, AirdropCampaignStatus.Claimable, page)
      },
    },
    select: {
      airdrop: (i) => airdropDetail(i),
      userAirdropStatus: (i, _ev, ctx) => setAirdropStatus(i, ctx),
    },
    ...context,
  },
  states: {
    claimableAirdrops: {
      on: {
        VIEW_AIRDROP_DETAIL: "airdrop",
        VIEW_LIVE: "claimableAirdrops",
        VIEW_ENDED: "claimableAirdrops",
        VIEW_IGNORED: "claimableAirdrops",
        // special, reserved event name
        NEXT_PAGE: "claimableAirdrops",
        PREV_PAGE: "claimableAirdrops",
      },
    },
    airdrop: {
      on: {
        BACK: "claimableAirdrops",
        SET_AIRDROP_STATUS: "userAirdropStatus",
      },
    },
    userAirdropStatus: {
      on: {
        BACK: "claimableAirdrops",
        SET_AIRDROP_STATUS: "userAirdropStatus",
      },
    },
  },
})

export const slashCmd: SlashCommand = {
  name: "claimable",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("claimable")
      .setDescription("view claimable airdrop campaigns")

    return data
  },
  run: async function (interaction: CommandInteraction) {
    const status =
      interaction.options.getString("status", false) ??
      AirdropCampaignStatus.Claimable

    const { context, msgOpts } = await run(
      interaction.user.id,
      status as AirdropCampaignStatus
    )

    const reply = (await interaction.editReply(msgOpts)) as Message

    route(reply, interaction, machineConfig(context))
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}
