import {
  DEFI_DEFAULT_FOOTER,
  PREFIX,
  SLASH_PREFIX,
  TIP_GITBOOK,
} from "utils/constants"
import { getEmoji, thumbnails } from "utils/common"
import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SlashCommandBuilder } from "@discordjs/builders"
import tip from "./index/text"
import tipSlash from "./index/slash"

const textCmd: Command = {
  id: "tip",
  command: "tip",
  brief: "Tip Bot",
  category: "Defi",
  run: tip,
  featured: {
    title: `${getEmoji("tip")} Tip`,
    description: "Send coins to a user or a group of users",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TIP,
        usage: `${PREFIX}tip <recipient(s)> <amount> <token> [each]\n${PREFIX}tip <recipient(s)> <amount> <token> [each] ["message"] [--onchain]`,
        description: "Send coins offchain to a user or a group of users",
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Tip Bot",
      }).addFields(
        {
          name: "You can send to the recipient by:",
          value: `${getEmoji(
            "POINTINGRIGHT"
          )} Username(s): \`@minh\`, \`@tom\`\n${getEmoji(
            "POINTINGRIGHT"
          )} Role(s): \`@Staff\`, \`@Dev\`\n${getEmoji(
            "POINTINGRIGHT"
          )} #Text_channel: \`#mochi\`, \`#channel\`\n${getEmoji(
            "POINTINGRIGHT"
          )} In voice channel: mention “\`in voice channel\`” to tip members currently in\n${getEmoji(
            "POINTINGRIGHT"
          )} Online status: add the active status “\`online\`” before mentioning recipients`,
        },
        {
          name: "Tip with token:",
          value: `${getEmoji(
            "POINTINGRIGHT"
          )} Tip by the cryptocurrencies, choose one in the \`$token list\`.\n${getEmoji(
            "POINTINGRIGHT"
          )} To tip by moniker, choose one in the \`$moniker list\`.`,
        },
        {
          name: "**Examples**",
          value: `\`\`\`${PREFIX}tip @John 10 ftm\n${PREFIX}tip @John @Hank all ftm\n${PREFIX}tip @RandomRole 10 ftm\n${PREFIX}tip @role1 @role2 1 ftm each\n${PREFIX}tip in voice channel 1 ftm each\n${PREFIX}tip online #mochi 1 ftm\n${PREFIX}tip @John 1 ftm "Thank you"\`\`\``,
        },
        {
          name: "**Instructions**",
          value: `[**Gitbook**](${TIP_GITBOOK})`,
        }
      ),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 4,
}

const slashCmd: SlashCommand = {
  name: "tip",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("tip")
      .setDescription("Send coins to a user or a group of users")
      .addStringOption((option) =>
        option
          .setName("users")
          .setDescription("users or role you want to tip. Example: @John")
          .setRequired(true)
      )
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("amount of coins you want to send. Example: 5")
          .setMinValue(0)
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("symbol of token. Example: FTM")
          .setRequired(true)
      )
      .addBooleanOption((option) =>
        option
          .setName("each")
          .setDescription(
            "true if amount is for each recipients, false if amount is divided equally"
          )
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("message when tip recipients")
          .setRequired(false)
      )
  },
  run: tipSlash,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TIP,
        usage: `${SLASH_PREFIX}tip <recipient(s)> <amount> <token> [each]\n${SLASH_PREFIX}tip <recipient(s)> <amount> <token> [each] ["message"]`,
        description: "Send coins offchain to a user or a group of users",
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Tip Bot",
      }).addFields(
        {
          name: "You can send to the recipient by:",
          value: `${getEmoji(
            "POINTINGRIGHT"
          )} Username(s): \`@minh\`, \`@tom\`\n${getEmoji(
            "POINTINGRIGHT"
          )} Role(s): \`@Staff\`, \`@Dev\`\n${getEmoji(
            "POINTINGRIGHT"
          )} #Text_channel: \`#mochi\`, \`#channel\`\n${getEmoji(
            "POINTINGRIGHT"
          )} In voice channel: mention “\`in voice channel\`” to tip members currently in\n${getEmoji(
            "POINTINGRIGHT"
          )} Online status: add the active status “\`online\`” before mentioning recipients`,
        },
        {
          name: "Tip with token:",
          value: `${getEmoji(
            "POINTINGRIGHT"
          )} Tip by the cryptocurrencies, choose one in the \`$token list\`.\n${getEmoji(
            "POINTINGRIGHT"
          )} To tip by moniker, choose one in the \`$moniker list\`.`,
        },
        {
          name: "**Examples**",
          value: `\`\`\`${SLASH_PREFIX}tip @John 10 ftm\n${SLASH_PREFIX}tip @John @Hank all ftm\n${SLASH_PREFIX}tip @RandomRole 10 ftm\n${SLASH_PREFIX}tip @role1 @role2 1 ftm each\n${SLASH_PREFIX}tip in voice channel 1 ftm each\n${SLASH_PREFIX}tip online #mochi 1 ftm\n${SLASH_PREFIX}tip @John 1 ftm "Thank you"\`\`\``,
        },
        {
          name: "**Instructions**",
          value: `[**Gitbook**](${TIP_GITBOOK})`,
        }
      ),
    ],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
