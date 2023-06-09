import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { MachineConfig, route } from "utils/router"
import { CommandInteraction, Message } from "discord.js"
import { PageType, run } from "./index/processor"

export const machineConfig: MachineConfig = {
  id: "earn",
  initial: "earn",
  states: {
    earn: {
      on: {
        VIEW_AIRDROPS: "airdrops",
        VIEW_QUESTS: "quests",
      },
    },
    airdrops: {
      on: {
        VIEW_AIRDROP_DETAIL: "airdrop",
        VIEW_QUEST: "quests",
        // special, reserved event name
        NEXT_PAGE: "airdrops",
        PREV_PAGE: "airdrops",
        BACK: "earn",
      },
    },
    airdrop: {
      on: {
        BACK: "airdrops",
      },
    },
    quests: {
      on: {
        VIEW_AIRDROP: "airdrops",
        BACK: "earn",
      },
    },
  },
}

export const defaultPageType: Exclude<PageType, "earn"> = "index"

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
    route(replyMsg, interaction.user, machineConfig)
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
