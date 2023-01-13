import { Command, SlashCommand } from "types/common"
import { CommandInteraction } from "discord.js"
import {
  DEPOSIT_GITBOOK,
  PREFIX,
  DEFI_DEFAULT_FOOTER,
  SLASH_PREFIX,
} from "utils/constants"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { getEmoji } from "utils/common"
import { SlashCommandBuilder } from "@discordjs/builders"
import deposit from "./index/text"
import depositSlash from "./index/slash"

const textCmd: Command = {
  id: "deposit",
  command: "deposit",
  brief: "Deposit",
  category: "Defi",
  run: deposit,
  featured: {
    title: `${getEmoji("left_arrow")} Deposit`,
    description: "Deposit tokens into your in-discord wallet",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}deposit <currency>`,
        description: "Offchain deposit token",
        examples: `${PREFIX}deposit eth`,
        footer: [DEFI_DEFAULT_FOOTER],
        document: DEPOSIT_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["dep"],
  allowDM: true,
  colorType: "Defi",
  minArguments: 2,
}

const slashCmd: SlashCommand = {
  name: "deposit",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("deposit")
      .setDescription("Deposit your tokens into your discord wallet")
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("the token symbol which you wanna deposit")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const symbol = interaction.options.getString("token", true)
    return await depositSlash(interaction, symbol)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}deposit <token>`,
        examples: `${SLASH_PREFIX}deposit ftm`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
