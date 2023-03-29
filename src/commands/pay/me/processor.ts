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
import community from "adapters/community"
import { sendNotificationMsg } from "utils/kafka"
import { KafkaNotificationMessage } from "types/common"
import { MOCHI_ACTION_PAY_ME, MOCHI_PLATFORM_DISCORD } from "utils/constants"
import defi from "../../../adapters/defi"
import CacheManager from "cache/node-cache"

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

  //send notification to recipient if target is specified
  const walletNotification = accounts
    .filter(
      (w: any) => w.platform === "solana-chain" || w.platform === "evm-chain"
    )
    .map((w: any) => {
      return {
        chain: w.platform,
        address: w.platform_identifier,
      }
    })
  if (hasTarget) {
    const { data: coins, curlSearchCoin } = await CacheManager.get({
      pool: "ticker",
      key: `ticker-search-${token.toLowerCase()}`,
      call: () => defi.searchCoins(token.toLowerCase()),
    })
    if (!coins || !coins.length) {
      throw new APIError({
        msgOrInteraction,
        description: `[getByDiscord] API error with status ${pfRes.status_code}`,
        curl: curlSearchCoin,
      })
    }
    let coinId = ""
    if (coins.length > 0) {
      coinId = coins[0].id
    }

    const {
      ok,
      data: coin,
      curl,
      log,
    } = await CacheManager.get({
      pool: "ticker",
      key: `ticker-getcoin-${coinId}`,
      call: () => defi.getCoin(coinId),
    })
    if (!ok) {
      throw new APIError({
        msgOrInteraction,
        description: log,
        curl: curl,
      })
    }

    const currency = "usd"
    const { current_price } = coin.market_data
    const currentPrice = +current_price[currency]
    const priceNumber = currentPrice * amount
    const price = parseFloat(priceNumber.toString()).toFixed(3)

    await sendNotification({
      author,
      platform,
      target,
      // token,
      // amount,
      // note,
      // payCode,
      message: {
        id: author.id,
        platform: MOCHI_PLATFORM_DISCORD,
        action: MOCHI_ACTION_PAY_ME,
        note: note,
        metadata: {
          amount: amount.toString(),
          token,
          price: price,
          pay_link: paylink,
          request_id: payCode,
          wallet: walletNotification,
        },
      },
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
  message,
}: {
  author: User
  platform?: string
  target?: string
  message: KafkaNotificationMessage
}) {
  if (!platform || !target) return
  // discord
  if (platform === "discord") {
    message.recipient_info = {
      discord: author.id,
    }

    sendNotificationMsg(message)
  }

  // telegram
  if (platform === "telegram") {
    // get tele id from username
    const { data, ok, curl, error, log } =
      await community.getTelegramByUsername(target)
    if (!ok) {
      throw new APIError({ curl, error, description: log })
    }
    message.recipient_info = {
      telegram: data.chat_id.toString(),
    }

    sendNotificationMsg(message)
    return
  }

  // mail
  if (platform === "mail") {
    message.recipient_info = {
      mail: target,
    }

    sendNotificationMsg(message)
    return
  }

  // twitter
  if (platform === "twitter") {
    message.recipient_info = {
      twitter: target,
    }

    sendNotificationMsg(message)
    return
  }
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
    res.platform = "twitter"
    res.target = value
    return res
  }

  res.valid = false
  return res
}
