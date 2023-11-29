import mochiPay from "adapters/mochi-pay"
import profile from "adapters/profile"
import { CommandInteraction, Message, MessageOptions } from "discord.js"
import { APIError } from "errors"
import { parseUnits } from "ethers/lib/utils"
import fs from "fs"
import * as qrcode from "qrcode"
import {
  composeEmbedMessage,
  composeInsufficientBalanceEmbed,
} from "ui/discord/embed"
import {
  TokenEmojiKey,
  getAuthor,
  equalIgnoreCase,
  getEmoji,
  emojis,
  getEmojiURL,
  getEmojiToken,
} from "utils/common"
import { utils } from "@consolelabs/mochi-ui"
import { UnsupportedTokenError } from "errors/unsupported-token"
import { isTokenSupported, parseMoniker } from "utils/tip-bot"
import { MOCHI_ACTION_PAY_LINK, MOCHI_PLATFORM_DISCORD } from "utils/constants"
import { reply } from "utils/discord"
import { dmUser } from "../../../utils/dm"
import moment from "moment-timezone"
import { embedsColors } from "types/common"
import { composeButtonLink } from "ui/discord/button"

export async function run({
  msgOrInteraction,
  amount,
  token,
  note,
  moniker,
  original_amount,
}: {
  msgOrInteraction: CommandInteraction
  amount: number
  token: TokenEmojiKey
  note: string
  moniker: string
  original_amount: number
}) {
  const author = getAuthor(msgOrInteraction)

  // get profile id
  const pfRes = await profile.getByDiscord(author.id)
  if (pfRes.err) {
    throw new APIError({
      msgOrInteraction,
      description: `[getByDiscord] API error with status ${pfRes.status_code}`,
      curl: pfRes.curl,
      status: pfRes.status ?? 500,
    })
  }

  const { data, ok } = await mochiPay.getBalances({
    profileId: pfRes.id,
    token,
    unique: true,
  })
  // no balance -> reject
  if (!data || !data.length) {
    const errEmbed = composeInsufficientBalanceEmbed({
      required: amount,
      symbol: token,
      author,
    })
    await msgOrInteraction.editReply({ embeds: [errEmbed] })
    return
  }
  const bal = data[0]

  const res: any = await mochiPay.generatePaymentCode({
    profileId: pfRes.id,
    amount: parseUnits(
      amount.toLocaleString().replaceAll(",", ""),
      bal.token?.decimal ?? 0,
    ).toString(),
    token_id: bal.token?.id,
    note,
    type: MOCHI_ACTION_PAY_LINK,
    from_platform: MOCHI_PLATFORM_DISCORD,
    moniker,
    original_amount: amount.toString(),
  })

  if (!res.ok && equalIgnoreCase(res.err, "insufficient balance")) {
    // reply with error embed
    const errEmbed = composeInsufficientBalanceEmbed({
      required: amount,
      symbol: token,
      author,
    })
    await msgOrInteraction.editReply({ embeds: [errEmbed] })
    return
  }

  // compose pay-link embed
  const payCode = res.data.code
  const paylink = `https://mochi.gg/pay/${payCode}`
  const qrFileName = `qr_paylink_${author.id}.png`
  await qrcode.toFile(qrFileName, paylink).catch(() => null)

  const dmEmbedMsg1 = composeEmbedMessage(null, {
    author: [`[${res.data.code.substr(0, 5)}] New pay link created`],
    thumbnail: `${getEmojiURL(emojis.WEB)}`,
    description: [
      `${getEmoji("PROPOSAL", false)}\`Pay link.     \`[${
        res.data.code
      }](${paylink})`,
      `${getEmoji("NFT", false)}\`Amount.       \`${
        moniker !== ""
          ? `**${utils.formatTokenDigit(
              original_amount,
            )} ${moniker}** \\( **${utils.formatTokenDigit(
              amount,
            )} ${token}** ≈ ${utils.formatUsdDigit(res.data.usd_amount)}\\)`
          : `${getEmojiToken(token, false)} **${utils.formatTokenDigit(
              amount,
            )} ${token}** \\(≈ ${utils.formatUsdDigit(res.data.usd_amount)}\\)`
      }`,
      `${getEmoji("BIN", false)}\`Expired Date. \`${moment(
        res.data.expired_at,
      ).fromNow()}`,
      note !== "" ? `${getEmoji("CHAT", false)}\`Message.      \`${note}` : "",
      ...(note !== "" ? [""] : []),
      `${getEmoji(
        "ANIMATED_POINTING_DOWN",
        true,
      )}Share the pay link with your friends for them to claim, but remember it's limited to one user.`,
    ].join("\n"),
    originalMsgAuthor: author,
    color: embedsColors.Paylink,
    noFooter: true,
  })

  const dmEmbedMsg2 = composeEmbedMessage(null, {
    description: paylink,
    originalMsgAuthor: author,
    color: embedsColors.Paylink,
    noFooter: true,
  })

  const replyMsg = composeEmbedMessage(null, {
    description: `Forward the Pay link from ${msgOrInteraction.client.user} to your friends for them to claim.`,
    originalMsgAuthor: author,
    color: embedsColors.Paylink,
  })

  const isDm = msgOrInteraction.channel?.type === "DM"
  let dm: any
  if (isDm) {
    await reply(msgOrInteraction, {
      messageOptions: {
        embeds: [dmEmbedMsg1],
      },
    })
  } else {
    await dmUser(
      {
        embeds: [dmEmbedMsg1],
      },
      author,
      null,
      null,
    )
  }

  dm = await dmUser(
    {
      content: paylink,
    },
    author,
    null,
    null,
  )

  await dmUser(
    {
      files: [{ attachment: qrFileName }],
    },
    author,
    null,
    null,
  )

  if (!isDm) {
    await reply(msgOrInteraction, {
      messageOptions: {
        embeds: [replyMsg],
        components: [composeButtonLink("See the DM", dm?.url ?? "")],
      },
    })
  }
  // remove qr file
  fs.unlink(qrFileName, () => null)
  return
}

export async function parsePaylinkArgs(
  interaction: CommandInteraction,
): Promise<{
  amount: number
  token: string
  note: string
  moniker: string
  originalAmount: number
}> {
  let amount = interaction.options.getNumber("amount", true)
  let token = interaction.options.getString("token", true)
  const note = interaction.options.getString("message") ?? ""
  let parsedAmount = amount

  // check if unit is a valid token ...
  const isToken = await isTokenSupported(token)
  let monikerData
  // if not then it could be a moniker
  if (!isToken) {
    monikerData = await parseMoniker(token, interaction.guildId ?? "")
  }
  amount = parsedAmount * (monikerData?.moniker?.amount ?? 1)
  token = (monikerData?.moniker?.token?.token_symbol ?? token).toUpperCase()
  let moniker = monikerData?.moniker?.moniker || ""
  // if unit is not either a token or a moniker -> reject
  if (!moniker && !isToken) {
    throw new UnsupportedTokenError({
      msgOrInteraction: interaction,
      symbol: token,
    })
  }

  return {
    amount,
    token,
    note,
    moniker,
    originalAmount: parsedAmount,
  }
}
