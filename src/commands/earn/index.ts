import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"

import newSlash from "./new/slash"

const subCommands: Record<string, SlashCommand> = {
  new: newSlash,
}

const slashCmd: SlashCommand = {
  name: "earn",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("earn")
      .setDescription("Earn airdrop")

    data.addSubcommand(<SlashCommandSubcommandBuilder>newSlash.prepare())
    return data
  },

  run: () =>
    Promise.resolve({
      messageOptions: {
        content: "earn",
      },
    }),
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
