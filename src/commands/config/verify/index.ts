import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import infoSlash from "./info/slash"
import removeSlash from "./remove/slash"
import setSlash from "./set/slash"
import captchaSlash from "./captcha/slash"
import { CommandInteraction } from "discord.js"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"

const slashActions: Record<string, SlashCommand> = {
  set: setSlash,
  info: infoSlash,
  remove: removeSlash,
  // captcha: captchaSlash,
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
    // data.addSubcommand(<SlashCommandSubcommandBuilder>captchaSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return await slashActions[interaction.options.getSubcommand()].run(
      interaction,
    )
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
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
  ephemeral: true,
}

export default { slashCmd }
