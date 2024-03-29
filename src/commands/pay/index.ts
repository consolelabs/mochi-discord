import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import {
  SLASH_PREFIX,
  DEFI_DEFAULT_FOOTER,
  PAY_LINK_GITBOOK,
} from "utils/constants"
import link from "./link/slash"
import me from "./me/slash"
import meStatus from "./me-status/slash"
import linkStatus from "./link-status/slash"

const actions: Record<string, SlashCommand> = {
  link,
  me,
  "me-status": meStatus,
  "link-status": linkStatus,
}

const slashCmd: SlashCommand = {
  name: "pay",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("pay")
      .setDescription("Finish all due payments right in Discord")
      .addSubcommand(<SlashCommandSubcommandBuilder>link.prepare())
      .addSubcommand(<SlashCommandSubcommandBuilder>me.prepare())
      .addSubcommand(<SlashCommandSubcommandBuilder>meStatus.prepare())
      .addSubcommand(<SlashCommandSubcommandBuilder>linkStatus.prepare())
  },
  run: (interaction) => {
    return actions[interaction.options.getSubcommand()].run(interaction)
  },
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          thumbnail: thumbnails.TOKENS,
          usage: `${SLASH_PREFIX}pay`,
          description: "Finish all due payments right in Discord",
          footer: [DEFI_DEFAULT_FOOTER],
          examples: `${SLASH_PREFIX}pay me\n${SLASH_PREFIX}pay link`,
          document: PAY_LINK_GITBOOK,
          includeCommandsList: true,
        }),
      ],
    }),
  colorType: "Defi",
  ephemeral: true,
}

export default { slashCmd }
