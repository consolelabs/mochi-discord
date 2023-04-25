import { SlashCommandBuilder } from "@discordjs/builders"
import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getCommandArguments } from "utils/commands"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { PREFIX, SLASH_PREFIX, TIP_GITBOOK } from "utils/constants"
import tipSlash from "./index/slash"
import tip from "./index/text"
import tipTelegram from "./telegram/text"
import tipMail from "./mail/text"
import tipTwitter from "./twitter/text"

const getHelpMessage = async (isSlash?: boolean) => {
  const prefix = isSlash ? SLASH_PREFIX : PREFIX

  return {
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: getEmojiURL(emojis.CASH),
        description: "Send coins to a user or a group of users",
        author: ["Tip Bot", getEmojiURL(emojis.INFO_VAULT)],
      }).addFields(
        {
          name: "Usage",
          value: [
            `Tip off-chain:`,
            `\`\`\`${prefix}tip <recipient> <amount> <token> [each] ["message"]\`\`\``,
            `Tip on-chain:`,
            `\`\`\`${prefix}tip <recipient> <amount> <token> [each] ["message"] --onchain\`\`\``,
          ].join("\n"),
        },
        {
          name: "You can send to the recipient by",
          value: [
            `${getEmoji(
              "COMMAND"
            )} \`@minh\` | \`@role\` | \`#channel\`: usernames, roles or #text-channel`,
            `e.g. ${prefix}tip @John 10 ftm | ${prefix}tip @role1 @role 2 1 ftm each "Thank you"`,
            `${getEmoji(
              "NEWS"
            )} \`in voice channel\`: to tip members currently in voice channel`,
            `e.g. ${prefix}tip in voice channel 1 ftm each`,
            `${getEmoji(
              "ANIMATED_IDEA",
              true
            )} \`online\`: add "online" before mentioning recipients`,
            `e.g. ${prefix}tip online #mochi 1 ftm`,
            `${getEmoji(
              "TELEGRAM"
            )} \`tg:<telegram_username>\`: tip via Telegram`,
            `e.g. ${prefix}tip tg:John_ttb 1 ftm`,
            `${getEmoji("TWITTER")} \`tw:<username>\`: tip via Twitter`,
            `e.g. ${prefix}tip tw:John_ttb 1 ftm`,
            `${getEmoji(
              "ANIMATED_MAIL_SEND",
              true
            )} \`email:<email_address>\`: tip via email`,
            `e.g. ${prefix}tip email:John.mochi@gmail.com 2 ftm`,
          ].join("\n"),
        },
        {
          name: "Tip with token",
          value: [
            `${getEmoji(
              "CASH"
            )} Tip by the cryptocurrencies, choose one in the \`$token list\``,
            `${getEmoji(
              "MONIKER"
            )} Use \`${prefix}tip <@users> <amount> <moniker>\` to tip your friend moniker`,
            `e.g. ${prefix}tip @anna 1 cookie. Run ${prefix}moniker command to see more`,
            ``,
            `[Read instructions](${TIP_GITBOOK}) for a complete setup guide`,
          ].join("\n"),
        }
      ),
    ],
  }
}

const textCmd: Command = {
  id: "tip",
  command: "tip",
  brief: "Tip Bot",
  category: "Defi",
  run: async (msg) => {
    const args = getCommandArguments(msg)
    const telPrefixes = ["tg@", "tg:", "t.me/"]
    const telPrefix = telPrefixes.find((p) =>
      args[1].toLowerCase().startsWith(p)
    )
    const mailPrefixes = ["email:", "gmail:"]
    const mailPrefi = mailPrefixes.find((p) =>
      args[1].toLowerCase().startsWith(p)
    )
    const twPrefixes = ["tw:", "tw@"]
    const twPrefi = twPrefixes.find((p) => args[1].toLowerCase().startsWith(p))
    // tip telegram
    if (telPrefix) {
      args[1] = args[1].replace(telPrefix, "") // remove prefix tg@
      await tipTelegram(msg, args)
      return
    }
    // tip mail
    if (mailPrefi) {
      args[1] = args[1].replace(mailPrefi, "") // remove prefix email:
      await tipMail(msg, args)
      return
    }
    // tip tw
    if (twPrefi) {
      args[1] = args[1].replace(twPrefi, "") // remove prefix email:
      await tipTwitter(msg, args)
      return
    }
    // tip discord
    await tip(msg)
  },
  getHelpMessage: () => getHelpMessage(),
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
          .setDescription(
            "symbol of token or moniker. e.g. token: ftm, eth - moniker: tea, cookie"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("each")
          .addChoice("Same", "each")
          .addChoice("Separate", "separate")
          .setDescription(
            "Same amount is for each recipient. Seperate amount is divided equally"
          )
      )
      .addStringOption((option) =>
        option.setName("message").setDescription("message when tip recipients")
      )
      .addMentionableOption((option) =>
        option
          .setName("eacha")
          .setDescription(
            "Same amount is for each recipient. Seperate amount is divided equally"
          )
      )
  },
  run: tipSlash,
  help: () => getHelpMessage(true),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
