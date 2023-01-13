import { SlashCommandBuilder } from "@discordjs/builders"
import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji } from "utils/common"
import sendxp from "./index/text"
import sendxpSlash from "./index/slash"
import { PREFIX, SENDXP_GITBOOK, SLASH_PREFIX } from "utils/constants"

const textCmd: Command = {
  id: "sendxp",
  command: "sendxp",
  brief: "Send XP to members",
  category: "Community",
  run: sendxp,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: "Send XP to members",
        usage: `${PREFIX}sendXP <recipient(s)> <amount> [each]`,
        description: `You can send to recipients by:\n${getEmoji(
          "POINTINGRIGHT"
        )} Username(s): \`@tom\`, \`@john\`\n${getEmoji(
          "POINTINGRIGHT"
        )} Role(s): \`@dev\`, \`@staff\``,
        examples: `${PREFIX}sendXP @john 5\n${PREFIX}sendXP @staff 5 XP`,
        document: SENDXP_GITBOOK,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
  canRunWithoutAction: true,
  minArguments: 3,
}

const slashCmd: SlashCommand = {
  name: "sendxp",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("sendxp")
      .setDescription("Send XP to members")
      .addStringOption((option) =>
        option
          .setName("recipients")
          .setDescription("users or roles Example: @John")
          .setRequired(true)
      )
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("amount of xp to send. Example: 10")
          .setRequired(true)
          .setMinValue(1)
      )
      .addBooleanOption((option) =>
        option
          .setName("each")
          .setDescription(
            "true if amount is for each recipients, false if amount is divided equally"
          )
          .setRequired(false)
      )
      .setDefaultPermission(false)
    return data
  },
  run: sendxpSlash,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        title: "Send XP to members",
        usage: `${SLASH_PREFIX}sendXP <recipient(s)> <amount> [each]`,
        description: `You can send to recipients by:\n${getEmoji(
          "POINTINGRIGHT"
        )} Username(s): \`@tom\`, \`@john\`\n${getEmoji(
          "POINTINGRIGHT"
        )} Role(s): \`@dev\`, \`@staff\``,
        examples: `${SLASH_PREFIX}sendXP @john 5\n${SLASH_PREFIX}sendXP @staff 5 XP`,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
