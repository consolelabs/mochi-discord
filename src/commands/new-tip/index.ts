import { SlashCommandBuilder } from "@discordjs/builders"
import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getCommandArguments } from "utils/commands"
import { getEmoji, thumbnails } from "utils/common"
import {
  DEFI_DEFAULT_FOOTER,
  PREFIX,
  SLASH_PREFIX,
  TIP_GITBOOK,
} from "utils/constants"
import tipSlash from "./index/slash"
import tip from "./index/text"
import tipTelegram from "./telegram/text"
import tipMail from "./mail/text"
import tipTwitter from "./twitter/text"

const getHelpMessage = async (isSLash?: boolean) => {
  const prefix = isSLash ? SLASH_PREFIX : PREFIX
  const pointingright = getEmoji("pointingright")
  const usageTipOnChain = `-- Tip onchain or offchain\n${prefix}tip <recipient(s)> <amount> <token> [each]\n${prefix}tip <recipient(s)> <amount> <token> [each] ["message"] [--onchain]`
  const usageTipTele = `-- Tip Telegram\n${prefix}tip tg:<telegram_username> <amount> <token>`
  const usageTipEmail = `-- Tip Email\n${prefix}tip email:<email_address> <amount> <token>`
  const usageTipTwitter = `-- Tip Twitter\n${prefix}tip twitter:<user_name> <amount> <token>`
  return {
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TIP,
        usage: `${usageTipOnChain}\n\n${usageTipTele}\n\n${usageTipEmail}\n\n${usageTipTwitter}`,
        description: "Send coins offchain to a user or a group of users",
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Tip Bot",
      }).addFields(
        {
          name: "You can send to the recipient by:",
          value: `${pointingright} Username(s): \`@minh\`, \`@tom\`\n${pointingright} Role(s): \`@Staff\`, \`@Dev\`\n${pointingright} #Text_channel: \`#mochi\`, \`#channel\`\n${pointingright} In voice channel: mention “\`in voice channel\`” to tip members currently in\n${pointingright} Online status: add the active status “\`online\`” before mentioning recipients\n${pointingright} Telegram username, email or twitter name. In Telegram particular, find the telegram bot https://t.me/telmochibot and DM it first`,
        },
        {
          name: "Tip with token:",
          value: `${pointingright} Tip by the cryptocurrencies, choose one in the \`$token list\`.\n${pointingright} To tip by moniker, choose one in the \`$moniker list\`.`,
        },
        {
          name: "**Examples**",
          value: `\`\`\`${prefix}tip @John 10 ftm\n${prefix}tip @John @Hank all ftm\n${prefix}tip @RandomRole 10 ftm\n${PREFIX}tip @role1 @role2 1 ftm each\n${prefix}tip in voice channel 1 ftm each\n${prefix}tip online #mochi 1 ftm\n${prefix}tip @John 1 ftm "Thank you"\n${prefix}tip tg:John_ttb 1 ftm\n${prefix}tip email:John.mochi@gmail.com 2 ftm\n${prefix}tip twitter:John_ttb 1 ftm\`\`\``,
        },
        {
          name: "**Instructions**",
          value: `[**Gitbook**](${TIP_GITBOOK})`,
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
  featured: {
    title: `${getEmoji("TIP", true)} Tip`,
    description: "Send coins to a user or a group of users",
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
          .addChoice("Seperate", "seperate")
          .setDescription(
            "Same amount is for each recipient. Seperate amount is divided equally"
          )
      )
      .addStringOption((option) =>
        option.setName("message").setDescription("message when tip recipients")
      )
  },
  run: tipSlash,
  help: () => getHelpMessage(true),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
