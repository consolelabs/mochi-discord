import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { MachineConfig, route } from "utils/router"
import { CommandInteraction, Message } from "discord.js"
import { EarnView, run } from "./index/processor"
// import { machineConfig as questsMachineConfig } from "commands/quest"
// import { machineConfig as dropMachineConfig } from "commands/drop/available"

export const machineConfig: MachineConfig = {
  id: "earn",
  initial: "dashboardAirdrop",
  context: {
    button: {
      dashboardAirdrop: (i) => run(i.user, EarnView.Airdrop),
      dashboardQuest: (i) => run(i.user, EarnView.Quest),
    },
  },
  states: {
    dashboardAirdrop: {
      on: {
        VIEW_QUEST_DASHBOARD: "dashboardQuest",
      },
    },
    dashboardQuest: {
      on: {
        VIEW_AIRDROP_DASHBOARD: "dashboardAirdrop",
      },
    },
  },
}

const slashCmd: SlashCommand = {
  name: "earn",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("earn")
      .setDescription(
        "view earning opportunities, from airdrop campaigns to quests"
      )
    return data
  },
  run: async function (interaction: CommandInteraction) {
    const { msgOpts } = await run(interaction.user)
    const replyMsg = (await interaction.editReply(msgOpts)) as Message
    route(replyMsg, interaction, machineConfig)
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          description: "Check on your quests and what rewards you can claim",
          usage: `${SLASH_PREFIX}earn`,
          examples: `${SLASH_PREFIX}earn`,
          footer: [`Type ${SLASH_PREFIX}earn`],
        }),
      ],
    }),
  colorType: "Server",
}

export default { slashCmd }
