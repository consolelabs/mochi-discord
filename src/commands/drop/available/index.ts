import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import {
  run,
  AirdropCampaignStatus,
  airdropDetail,
  setCampaignStatus,
} from "./processor"
import { CommandInteraction, Message } from "discord.js"
import { MachineConfig, route } from "utils/router"

export const machineConfig: MachineConfig = {
  id: "drop available",
  initial: "airdrops",
  context: {
    button: {
      airdrops: (i, ev, ctx) => {
        let status = AirdropCampaignStatus.Live
        if (ev === "VIEW_ENDED") status = AirdropCampaignStatus.Ended
        if (ev === "VIEW_IGNORED") status = AirdropCampaignStatus.Ignored

        return run(i.user.id, status, ctx.page)
      },
    },
    select: {
      airdrop: (i) => airdropDetail(i),
      setCampaignStatus: (i) => setCampaignStatus(i),
    },
  },
  states: {
    airdrops: {
      on: {
        VIEW_AIRDROP_DETAIL: "airdrop",
        VIEW_LIVE: "airdrops",
        VIEW_ENDED: "airdrops",
        VIEW_IGNORED: "airdrops",
        // special, reserved event name
        NEXT_PAGE: "airdrops",
        PREV_PAGE: "airdrops",
      },
    },
    airdrop: {
      on: {
        BACK: "airdrops",
      },
    },
  },
}

export const slashCmd: SlashCommand = {
  name: "available",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("available")
      .setDescription("view available airdrop campaigns")
      .addStringOption((opt) =>
        opt
          .setName("status")
          .setDescription("filter airdrops by its status")
          .setChoices([
            ["live", "live"],
            ["ended", "ended"],
            ["ignored", "ignore"],
          ])
          .setRequired(false)
      )

    return data
  },
  run: async function (interaction: CommandInteraction) {
    const status =
      interaction.options.getString("status", false) ??
      AirdropCampaignStatus.Live
    const { msgOpts } = await run(
      interaction.user.id,
      status as AirdropCampaignStatus
    )

    const reply = (await interaction.editReply(msgOpts)) as Message

    route(reply, interaction, machineConfig)
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}
