import { SlashCommand } from "types/common"
import { SLASH_PREFIX, SALE_TRACKER_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import list from "./list"
import remove from "./remove"
import track from "./track"

import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const subCommands: Record<string, SlashCommand> = {
  list,
  remove,
  track
}

const command: SlashCommand = {
  name: "sales",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("sales")
      .setDescription(
        "NFT sales tracker"
      )
    data.addSubcommand(<SlashCommandSubcommandBuilder>list.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>remove.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>track.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}sales <action>`,
        description: "Receive real-time notification whenever there is a sale",
        examples: `${SLASH_PREFIX}sales list\n${SLASH_PREFIX}sale list\n${SLASH_PREFIX}sales track #general 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73 250`,
        footer: [`Type ${SLASH_PREFIX}help sales <action> for a specific action!`],
        document: SALE_TRACKER_GITBOOK,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Marketplace",
}

export default command
