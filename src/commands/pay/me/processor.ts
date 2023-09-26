import mochiPay from "adapters/mochi-pay"
import profile from "adapters/profile"
import { utils } from "@consolelabs/mochi-ui"
import { CommandInteraction } from "discord.js"
import { APIError, InternalError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { UnsupportedTokenError } from "errors/unsupported-token"
import { isTokenSupported, parseMoniker } from "utils/tip-bot"

import {
  TokenEmojiKey,
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  isValidAmount,
} from "utils/common"
import {
  MOCHI_ACTION_PAY_ME,
  MOCHI_PLATFORM_DISCORD,
  PREFIX_EMAIL_HANDLER,
  PREFIX_DISCORD_HANDLER,
  PREFIX_TELEGRAM_HANDLER,
  SPACES_REGEX,
} from "utils/constants"
import { reply } from "utils/discord"
import { sendNotificationMsg } from "utils/kafka"
import { dmUser } from "../../../utils/dm"
import { parseUnits } from "ethers/lib/utils"
import { getToken } from "../../../utils/tip-bot"
import { parseDiscordToken } from "../../../utils/commands"
import { Message } from "@solana/web3.js"

const typePayRequest = 16
export async function run({
  msgOrInteraction,
  targets,
  amount,
  token,
  note,
  moniker,
  original_amount,
}: {
  msgOrInteraction: CommandInteraction
  targets: any
  amount: number
  token: TokenEmojiKey
  note: string
  moniker: string
  original_amount: number
}) {
  const author = getAuthor(msgOrInteraction)
  const tokenEmoji = getEmojiToken(token)
  // get profile id
  const p = await profile.getByDiscord(author.id)
  if (p.err) {
    throw new APIError({
      msgOrInteraction,
      description: `[getByDiscord] API error with status ${p.status_code}`,
      curl: "",
    })
  }

  const t = await getToken(token)

  let { data: inAppWallets, ok: mochiWalletResOk } =
    await mochiPay.getMochiWalletsByProfileId(p.id)
  if (!mochiWalletResOk) throw new Error()
  inAppWallets ||= []
  inAppWallets = inAppWallets.filter((w: any) => {
    if (t?.chain?.is_evm) {
      return equalIgnoreCase(w.chain.symbol, "evm")
    }
    return equalIgnoreCase(w.chain.symbol, t?.chain?.symbol ?? "")
  })

  const associatedAccs =
    p.associated_accounts
      ?.filter((aa: any) => aa.platform.includes("chain"))
      .map((aa: any) => {
        let symbol = "EVM"
        if (equalIgnoreCase(aa.platform, "ronin-chain")) {
          symbol = "RON"
        } else if (equalIgnoreCase(aa.platform, "sui-chain")) {
          symbol = "SUI"
        } else if (equalIgnoreCase(aa.platform, "solana-chain")) {
          symbol = "SOL"
        }
        return {
          wallet_address: aa.platform_identifier,
          chain: {
            symbol,
          },
        }
      })
      .filter((w: any) => {
        if (t?.chain?.is_evm) {
          return equalIgnoreCase(w.chain.symbol, "evm")
        }
        return equalIgnoreCase(w.chain.symbol, t?.chain?.symbol ?? "")
      }) ?? []
  const isDm = msgOrInteraction.channel?.type === "DM"

  if (targets?.length) {
    const dmPayrequestMsg1 = composeEmbedMessage(null, {
      description: `Your payment request is created! Send this message to the friend to request the payment ${getEmoji(
        "ANIMATED_POINTING_DOWN",
        true,
      )}`,
      noFooter: true,
    })
    for (const target of targets) {
      const res: any = await mochiPay.generatePaymentCode({
        profileId: p.id,
        amount: parseUnits(
          amount.toLocaleString().replaceAll(",", ""),
          t?.decimal ?? 0,
        ).toString(),
        token,
        note,
        type: "payme",
        from_platform: "telegram",
        target_platform: target.platform,
        target: target.id,
        moniker,
        original_amount: amount.toString(),
      })

      const link = `https://mochi.gg/${p.profile_name || p.id}/receive/${
        res.data.code
      }`

      const dmPayrequestMsg2 = composeEmbedMessage(null, {
        description: [
          `Hey! ${author} requests you pay **${amount} ${token}**${
            note ? " with message:" : ""
          }`,
          ...(note ? [`\`${note}\``] : []),
          "",
          `You can pay me by using /tip ${author} ${amount} ${token} through ${
            msgOrInteraction.client.user
          } or via this pay link .[${res.data.code.substr(0, 5)}](${link})`,
        ].join("\n"),
        originalMsgAuthor: author,
        noFooter: true,
      })
      if (!isDm) {
        const dm = await dmUser(
          {
            embeds: [dmPayrequestMsg1, dmPayrequestMsg2],
          },
          author,
          null,
          null,
        )
        reply(msgOrInteraction, {
          messageOptions: {
            embeds: [
              composeEmbedMessage(null, {
                description: `A new Pay Me request has been generated in your ${msgOrInteraction.client.user}, forward it to your payer!`,
              }),
            ],
          },
        })
      } else {
        reply(msgOrInteraction, {
          messageOptions: {
            embeds: [dmPayrequestMsg1, dmPayrequestMsg2],
          },
        })
      }
      await sendNotificationMsg({
        type: typePayRequest,
        pay_request_metadata: {
          target_profile_id: target.id,
          user_profile_id: p.id,
          amount: utils.formatTokenDigit(amount),
          token,
          pay_link: link,
          request_id: res.data.code,
          action: MOCHI_ACTION_PAY_ME,
          note: note,
          from_platform: MOCHI_PLATFORM_DISCORD,
          target_platform: target.platform,
          moniker,
          original_amount: utils.formatTokenDigit(original_amount),
          usd_amount: utils.formatUsdDigit(res.data.usd_amount),
          wallets: [
            ...inAppWallets?.map((w: any) => ({
              chain: w.chain.symbol,
              platform_identifier: w.wallet_address,
            })),
            ...associatedAccs.map((w: any) => ({
              chain: w.chain.symbol,
              platform_identifier: w.wallet_address,
            })),
          ],
        },
      })
    }
  } else {
    const res: any = await mochiPay.generatePaymentCode({
      profileId: p.id,
      amount: parseUnits(
        amount.toLocaleString().replaceAll(",", ""),
        t?.decimal ?? 0,
      ).toString(),
      token,
      note,
      type: "payme",
      from_platform: "telegram",
      moniker,
      original_amount: amount.toString(),
    })

    const link = `https://mochi.gg/${p.profile_name || p.id}/receive/${
      res.data.code
    }`
    const dmPayrequestMsg1 = composeEmbedMessage(null, {
      author: [
        `[${res.data.code.substr(0, 5)}] New payment request`,
        getEmojiURL(emojis.BELL),
      ],
      description: [
        `\`Pay link.   \`[${res.data.code}](${link})`,
        `\`Amount.     \`${
          moniker !== ""
            ? `**${utils.formatTokenDigit(
                original_amount,
              )} ${moniker}** \\( **${utils.formatTokenDigit(
                amount,
              )} ${token}** ≈ ${utils.formatUsdDigit(res.data.usd_amount)}\\)`
            : `**${utils.formatTokenDigit(
                amount,
              )} ${token}** \\(≈ ${utils.formatUsdDigit(
                res.data.usd_amount,
              )}\\)`
        }`,
        `\`Requester.  \`${author}`,
        note !== "" ? `\`Message.    \`${note}` : "",
        ...(note !== "" ? [""] : []),
        `${getEmoji(
          "ANIMATED_POINTING_DOWN",
          true,
        )}You didn't mention who has to pay you. Copy the below message and send it to that person.`,
      ]
        .filter((line) => line !== undefined) // Remove undefined elements (empty lines)
        .join("\n"),
      originalMsgAuthor: author,
      noFooter: true,
    })
    const dmPayrequestMsg2 = composeEmbedMessage(null, {
      description: [
        `Hey! ${author} requests you pay **${amount} ${token}**${
          note ? " with message:" : ""
        }`,
        ...(note ? [`\`${note}\``] : []),
        "",
        `You can pay me by using /tip ${author} ${amount} ${token} through ${
          msgOrInteraction.client.user
        } or via this pay link .[${res.data.code.substr(0, 5)}](${link})`,
      ].join("\n"),
      originalMsgAuthor: author,
      noFooter: true,
    })
    if (!isDm) {
      await dmUser(
        {
          embeds: [dmPayrequestMsg1, dmPayrequestMsg2],
        },
        author,
        null,
        null,
      )
      reply(msgOrInteraction, {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              description: `Forward the Pay Me request from ${msgOrInteraction.client.user} to the payer, as the payer was not mentioned.`,
            }),
          ],
        },
      })
    } else {
      return reply(msgOrInteraction, {
        messageOptions: {
          embeds: [dmPayrequestMsg1, dmPayrequestMsg2],
        },
      })
    }
  }
}

function isValidEmail(target?: string): boolean {
  if (!target) return false
  const expression = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  return expression.test(target)
}

export async function resolveTarget(receivers: string[]) {
  if (!receivers) return
  const telegramUsernames: any[] = []
  const targetIds: { id: string; platform: string }[] = []

  for (const target of receivers) {
    if (PREFIX_DISCORD_HANDLER.some((handler) => target.startsWith(handler))) {
      const { value: targetId } = parseDiscordToken(target)
      const pfRes = await profile.getByDiscord(targetId)
      if (pfRes.error) {
        throw new Error("Couldn't get target user info")
      }
      targetIds.push({ id: pfRes.id, platform: "discord" })
    }

    if (
      PREFIX_EMAIL_HANDLER.some((handler) => target.startsWith(handler)) ||
      isValidEmail(target)
    ) {
      const validMail = isValidEmail(target.replace(/^(mail:|email:)/, ""))
      if (!validMail) {
        throw new Error(`Target email is in invalid format`)
      }
      const pfRes = await profile.getByEmail(
        target.replace(/(mail:|email:)/, ""),
      )
      if (pfRes.error) {
        throw new Error("Couldn't get target user info")
      }
      targetIds.push({ id: pfRes.id, platform: "email" })
    }

    if (PREFIX_TELEGRAM_HANDLER.some((handler) => target.startsWith(handler))) {
      telegramUsernames.push(target.replace(/^(tel:|telegram:)/, ""))
    }
  }

  if (telegramUsernames.length) {
    try {
      const { ok, data: cachedUsernames } =
        await profile.getByTelegramUsernames(telegramUsernames)
      const toId = await Promise.all(
        telegramUsernames.map(async (t: string) => {
          const username = t
          // get from cache
          if (ok && cachedUsernames[username]) {
            return cachedUsernames[username]
          }
        }),
      )

      const teleTargetProfiles: any = await profile.getByTelegramIds(toId)
      const teleTargetIds = teleTargetProfiles.data.map((p: any) => p.id)

      teleTargetIds.forEach((id: string) => {
        targetIds.push({ id, platform: "telegram" })
      })
    } catch (e: any) {
      throw new Error(e.message || "Couldn't get user data")
    }
  }

  return targetIds
}

export async function parsePaymeArgs(
  interaction: CommandInteraction | Message,
): Promise<{
  targets: any
  amount: number
  token: string
  note: string
  moniker: string
  originalAmount: number
}> {
  let amount = interaction.options.getNumber("amount", true)
  let token = interaction.options.getString("token", true)
  const recievers = interaction.options
    .getString("target", false)
    ?.split(SPACES_REGEX)
  const note = interaction.options.getString("note") ?? ""
  let parsedAmount = amount

  const targets = await resolveTarget(recievers)
  if (recievers?.length && targets?.length === 0) {
    throw new InternalError({
      title: "Incorrect recipients",
      description:
        "Mochi cannot find the recipients. Type @ to choose valid roles or usernames!",
      msgOrInteraction: interaction,
    })
  }
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
    targets,
    amount,
    token,
    note,
    moniker,
    originalAmount: parsedAmount,
  }
}
