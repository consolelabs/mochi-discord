import { getEmoji } from "utils/common"
import { DEFI_DEFAULT_FOOTER, PREFIX, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { Command, SlashCommand } from "types/common"
import statement from "./index/text"
import statementSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const textCmd: Command = {
  id: "statements",
  command: "statements",
  brief: "List all statement of your wallet",
  category: "Defi",
  run: statement,
  featured: {
    title: `${getEmoji("STATEMENTS")} Statements`,
    description: "List all transactions histories of your wallet",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}statements [token]`,
        description: "Show your statements",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${PREFIX}$statement\n{PREFIX}statements ftm`,
      }),
    ],
  }),
  aliases: ["statement"],
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 1,
}

const slashCmd: SlashCommand = {
  name: "statements",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("statements")
      .setDescription("List all transactions histories of your wallet")
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("symbol of token. Example: FTM")
          .setRequired(false)
      )
  },
  run: statementSlash,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}statements [token]`,
        description: "Show your statements",
        examples: `${SLASH_PREFIX}statements\n${SLASH_PREFIX}statements ftm`,
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Statements",
      }),
    ],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
