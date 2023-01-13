import community from "adapters/community"
import defi from "adapters/defi"
import { CommandInteraction, Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { getEmoji, roundFloatNumber } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

export function getSendXPSuccessEmbed(
  recipientsId: string[],
  authorId: string,
  amount: number,
  each: boolean
) {
  const usersMentions = recipientsId
    .map((userid) => {
      return `<@${userid}>`
    })
    .join(", ")

  return composeEmbedMessage(null, {
    title: `${getEmoji("XP2")} Successfully sent XP!`,
    description: `<@${authorId}> has sent ${usersMentions} **${
      each ? amount : roundFloatNumber(amount / recipientsId.length, 2)
    } XP**`,
    thumbnail:
      "https://cdn.discordapp.com/emojis/930840081554624632.webp?size=160&quality=lossless",
  })
}

export async function handleSendXp(
  msg: Message | CommandInteraction,
  mentions: string,
  amount: number,
  each: boolean
) {
  const authorId = msg instanceof Message ? msg.author.id : msg.user.id
  // user tip themselves alone
  if (mentions === `<@${authorId}>`) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "Fail to send XP!",
            description: "Users cannot tip themselves!",
          }),
        ],
      },
    }
  }
  const { isValid, targets } = defi.classifyTipSyntaxTargets(mentions)
  const recipients = await defi.parseRecipients(msg, targets, authorId)
  if (!isValid || recipients.length == 0) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "Fail to send XP!",
            description:
              "Mochi cannot find the recipients. Type @ to choose valid roles or usernames!",
          }),
        ],
      },
    }
  }
  const { ok, log, curl, error } = await community.sendXPtoUsers({
    recipients,
    sender: authorId,
    guild_id: msg.guildId ?? "",
    amount,
    each,
  })
  if (!ok) {
    throw new APIError({ description: log, curl, error })
  }
  return {
    messageOptions: {
      embeds: [getSendXPSuccessEmbed(recipients, authorId, amount, each)],
    },
  }
}

const command: Command = {
  id: "sendxp",
  command: "sendxp",
  brief: "Send XP to members",
  category: "Community",
  run: async (msg) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    // remove 'xp' argument
    const args = getCommandArguments(msg).filter(
      (arg) => arg.toLowerCase() !== "xp"
    )
    const each = args[args.length - 1].toLowerCase() === "each" ? true : false
    const amount = Number(each ? args[args.length - 2] : args[args.length - 1])
    if (Number.isNaN(amount)) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Fail to send XP!",
              description: "XP amount must be a number",
            }),
          ],
        },
      }
    }

    return handleSendXp(
      msg,
      args.slice(1, each ? -2 : -1).join(" "),
      amount,
      each
    )
  },
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
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
  canRunWithoutAction: true,
  minArguments: 3,
}

export default command
