import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { info, verifyInfo } from "./info"
import { set, verifySet } from "./set"
import { remove, verifyRemove } from "./remove"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const command: SlashCommand = {
  name: "verify",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("verify")
      .setDescription("Verify wallet")

    data.addSubcommand(info).addSubcommand(set).addSubcommand(remove)
    return data
  },
  run: async function (interaction: CommandInteraction) {
    switch (interaction.options.getSubcommand()) {
      case set.name:
        return verifySet(interaction)
      case remove.name:
        return verifyRemove(interaction)
      default:
        return verifyInfo(interaction)
    }
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

export default command
