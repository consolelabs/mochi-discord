import community from "adapters/community"
import { CommandInteraction, Message } from "discord.js"
import { APIError } from "errors"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { getEmoji, roundFloatNumber } from "utils/common"
import { classifyTipSyntaxTargets, parseRecipients } from "utils/tip-bot"

export function getSendXPSuccessEmbed(
  recipientsId: string[],
  authorId: string,
  amount: number,
  each: boolean,
) {
  const usersMentions = recipientsId
    .map((userid) => {
      return `<@${userid}>`
    })
    .join(", ")

  const amountEach = each
    ? amount
    : roundFloatNumber(amount / recipientsId.length, 2)
  return composeEmbedMessage(null, {
    title: `${getEmoji("ANIMATED_XP", true)} Successfully sent XP!`,
    description: `<@${authorId}> has sent ${usersMentions} **${amountEach} XP** ${
      recipientsId.length > 1 ? "each" : ""
    }`,
    thumbnail:
      "https://cdn.discordapp.com/emojis/930840081554624632.webp?size=160&quality=lossless",
  })
}

export async function handleSendXp(
  msg: Message | CommandInteraction,
  mentions: string,
  amount: number,
  each: boolean,
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
  const { isValid, targets } = classifyTipSyntaxTargets(mentions)
  const recipients = await parseRecipients(msg, targets, authorId)
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
  const {
    ok,
    log,
    curl,
    error,
    status = 500,
  } = await community.sendXPtoUsers({
    recipients,
    sender: authorId,
    guild_id: msg.guildId ?? "",
    amount,
    each,
  })
  if (!ok) {
    throw new APIError({ description: log, curl, error, status })
  }
  return {
    messageOptions: {
      embeds: [getSendXPSuccessEmbed(recipients, authorId, amount, each)],
    },
  }
}
