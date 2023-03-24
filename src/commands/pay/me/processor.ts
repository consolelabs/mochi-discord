import mochiPay from "adapters/mochi-pay"
import profile from "adapters/profile"
import { CommandInteraction, Message, User } from "discord.js"
import { APIError } from "errors"
import { composeButtonLink } from "ui/discord/button"
import { composeEmbedMessage } from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import {
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  getEmojiURL,
  isValidAmount,
} from "utils/common"
import { reply } from "utils/discord"

// DO NOT EDIT: if not anhnh
export async function run({
  msgOrInteraction,
  amount,
  token,
  hasTarget,
  platform,
  target,
  note,
}: {
  msgOrInteraction: Message | CommandInteraction
  amount: number
  token: string
  hasTarget?: boolean
  platform?: string
  target?: string
  note?: string
}) {
  const author = getAuthor(msgOrInteraction)
  const tokenEmoji = getEmoji(token)
  // get profile id
  const pfRes = await profile.getByDiscord(author.id)
  if (pfRes.err) {
    throw new APIError({
      msgOrInteraction,
      description: `[getByDiscord] API error with status ${pfRes.status_code}`,
      curl: "",
    })
  }
  const { id: profileId, profile_name, associated_accounts: accounts } = pfRes

  const res: any = await mochiPay.generatePaymentCode({
    profileId,
    amount: amount.toString(),
    token,
    type: "payme",
    note,
  })
  // api error
  if (!res.ok) {
    const { log: description, curl } = res
    throw new APIError({ msgOrInteraction, description, curl })
  }
  // compose pay-link embed
  const payCode = res.data.code
  const paylink = `https://mochi.gg/${
    profile_name || author.username
  }/receive/${payCode}`
  const embed = composeEmbedMessage(null, {
    originalMsgAuthor: author,
    author: ["You've just created a pay me link", getEmojiURL(emojis.APPROVE)],
    description: `Here's ${paylink} ${tokenEmoji} ${amount} ${token} ${
      note ? `with message ${getEmoji("message1")} \`\`\`${note}\`\`\`` : ""
    }\n${
      hasTarget ? "" : "Please copy the message below and send to your friend"
    }`,
  })
  const dm = await author.send({ embeds: [embed] })
  const walletType = equalIgnoreCase(token, "sol")
    ? "solana-chain"
    : "evm-chain"
  const wallets =
    accounts
      ?.filter((a: any) => a.platform === walletType)
      ?.slice(0, 3)
      ?.map(
        (w: any, i: number) =>
          `${getEmoji(`num_${i + 1}`)} ${w.platform_identifier}`
      ) ?? []

  const lines = [
    `${getEmoji("activity_cash")} Hey! ${author.username}#${
      author.discriminator
    } requests you pay ${amount} ${token}`,
    `Message: ${note}`,
    `Request id: ${payCode}`,
    `You can pay me via ${paylink}`,
    wallets.length ? "Or you can send to these wallet addresses below" : "",
    wallets.join("\n"),
  ]
  const text = lines.join("\n")
  if (!hasTarget) {
    await author.send(text)
  }

  // send notification to recipient if target is specified
  if (hasTarget) {
    await sendNotification({
      author,
      platform,
      target,
      // token,
      // amount,
      // note,
      // payCode,
      text,
    })
  }

  // redirect user to DM from text channel
  const isDm = msgOrInteraction.channel?.type === "DM"
  if (isDm) return null
  const redirectEmbed = composeEmbedMessage(null, {
    author: ["You've just created a pay me link", getEmojiURL(emojis.APPROVE)],
    description: `${author}, your pay me link has been sent to you. Check your DM!`,
    originalMsgAuthor: author,
  })
  reply(msgOrInteraction, {
    messageOptions: {
      embeds: [redirectEmbed],
      components: [composeButtonLink("See the DM", dm.url)],
    },
  })
}

// DO NOT DELETE: use this after mochi-notification support payme usecase
async function sendNotification({
  author,
  platform,
  target,
  text,
}: {
  author: User
  platform?: string
  target?: string
  text: string
}) {
  if (!platform || !target) return

  // only support discord for now
  // discord
  if (platform === "discord") {
    const user = await author.client.users.fetch(target, { force: true })
    await user?.send(text)
  }

  // DO NOT DELETE
  // // telegram
  // if (platform === "telegram") {
  //   await mochiTelegram.sendMessage({
  //     from: {
  //       platform: "discord",
  //       username: author.username,
  //     },
  //     to: {
  //       platform: "telegram",
  //       username: target,
  //     },
  //     token: token,
  //     amount: `${amount}`,
  //     message: note,
  //   })
  //   return
  // }

  // // mail
  // if (platform === "mail") {
  //   await mochiTelegram.sendMessage({
  //     from: {
  //       platform: "discord",
  //       username: author.username,
  //     },
  //     to: {
  //       platform: "telegram",
  //       username: target,
  //     },
  //     token: token,
  //     amount: `${amount}`,
  //     message: note,
  //   })
  //   return
  // }

  // // twitter
  // if (platform === "twitter") {
  //    .......
  // }
}

export function parseTarget(arg: string) {
  arg = arg.toLowerCase()
  const res = {
    hasTarget: true,
    valid: true,
    platform: "",
    target: "",
  }
  if (isValidAmount({ arg: arg })) {
    res.hasTarget = false
    return res
  }
  // discord
  const { isUser, value } = parseDiscordToken(arg)
  if (isUser) {
    res.platform = "discord"
    res.target = value
    return res
  }

  // telegram
  const telegramPrefixes = ["tg@", "tg:", "t.me/"]
  const tgp = telegramPrefixes.find((p) => arg.startsWith(p))
  if (tgp) {
    const value = arg.replaceAll(tgp, "")
    res.platform = "telegram"
    res.target = value
    return res
  }

  // mail
  const mailPrefixes = ["mail:", "email:", "gmail:"]
  const mp = mailPrefixes.find((p) => arg.startsWith(p))
  if (mp) {
    const value = arg.replaceAll(mp, "")
    res.platform = "mail"
    res.target = value
    return res
  }

  // twitter
  const twPrefixes = ["twitter@", "twitter:", "tw@", "tw:"]
  const twp = twPrefixes.find((p) => arg.startsWith(p))
  if (twp) {
    const value = arg.replaceAll(twp, "")
    res.platform = "mail"
    res.target = value
    return res
  }

  res.valid = false
  return res
}
