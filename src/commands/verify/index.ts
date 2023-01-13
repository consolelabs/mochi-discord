import { Command, SlashCommand } from "types/common"
import { PREFIX, SLASH_PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
import info from "./info/text"
import remove from "./remove/text"
import set from "./set/text"
import infoSlash from "./info/slash"
import removeSlash from "./remove/slash"
import setSlash from "./set/slash"
import { CommandInteraction } from "discord.js"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"

const actions: Record<string, Command> = {
  set,
  info,
  remove,
}

const textCmd: Command = {
  id: "verify",
  command: "verify",
  brief: "Verify wallet",
  category: "Community",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}verify <action>`,
        description:
          "Verify your wallet by connecting a Metamask wallet with your Discord server to use all DeFi functions offered by Mochi",
        examples: `${PREFIX}verify info\n${PREFIX}verify set #connect-wallet @verified`,
        document: VERIFY_WALLET_GITBOOK,
        footer: [`Type ${PREFIX}help verify <action> for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

const slashActions: Record<string, SlashCommand> = {
  set: setSlash,
  info: infoSlash,
  remove: removeSlash,
}

const slashCmd: SlashCommand = {
  name: "verify",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("verify")
      .setDescription("Verify wallet")

    data.addSubcommand(<SlashCommandSubcommandBuilder>infoSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>setSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}verify <action>`,
        examples: `${SLASH_PREFIX}verify info\n${SLASH_PREFIX}verify set #connect-wallet @verified`,
        footer: [`Type ${SLASH_PREFIX}help verify for a specific action!`],
        includeCommandsList: true,
        originalMsgAuthor: interaction.user,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
