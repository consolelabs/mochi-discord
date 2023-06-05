import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { MachineConfig } from "utils/router"
import airdrop from "./airdrop/slash"
import quest from "./quest/slash"

export const machineConfig: MachineConfig = {
  id: "earn",
  initial: "airdrops",
  states: {
    airdrops: {
      on: {
        VIEW_AIRDROP_DETAIL: "airdrop",
        VIEW_QUEST: "quests",
        PAGE: "airdrops",
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
      },
    },
  },
}

const subCommands: Record<string, SlashCommand> = {
  airdrop,
  quest,
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

    data.addSubcommand(<SlashCommandSubcommandBuilder>airdrop.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>quest.prepare())
    return data
  },
  run: (i) => subCommands[i.options.getSubcommand(true)]?.run(i),
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          usage: `${SLASH_PREFIX}earn`,
        }),
      ],
    }),
  colorType: "Defi",
}

export default { slashCmd }
