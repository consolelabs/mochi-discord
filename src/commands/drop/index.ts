import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { run, AirdropCampaignStatus, airdropDetail } from "./index/processor"
import { CommandInteraction, Message } from "discord.js"
import { MachineConfig, route } from "utils/router"

export const machineConfig: MachineConfig = {
  id: "drop",
  initial: "airdrops",
  context: {
    button: {
      airdrops: (i, _ev, ctx) => run(i.user.id, ctx.status, ctx.page),
    },
    select: {
      airdrop: (i) => airdropDetail(i),
    },
  },
  states: {
    airdrops: {
      on: {
        VIEW_AIRDROP_DETAIL: "airdrop",
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

const slashCmd: SlashCommand = {
  name: "drop",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("drop")
      .setDescription("view airdrop earning opportunities")
      .addStringOption((opt) =>
        opt
          .setName("status")
          .setDescription("filter airdrops by its status")
          .setChoices([
            ["new (default)", "new"],
            ["done", "done"],
            ["skipped", "skipped"],
          ])
          .setRequired(false)
      )

    return data
  },
  run: async function (interaction: CommandInteraction) {
    const status =
      interaction.options.getString("status", false) ??
      AirdropCampaignStatus.New
    const { msgOpts } = await run(
      interaction.user.id,
      status as AirdropCampaignStatus
    )

    const reply = (await interaction.editReply(msgOpts)) as Message

    route(reply, interaction, machineConfig)
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          description: "Check airdrops you can joins",
          usage: `${SLASH_PREFIX}drop`,
          examples: `${SLASH_PREFIX}drop`,
          footer: [`Type ${SLASH_PREFIX}drop`],
        }),
      ],
    }),
  colorType: "Server",
}

export default { slashCmd }
