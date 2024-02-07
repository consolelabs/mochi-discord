import mochiPay from "adapters/mochi-pay"
import profile from "adapters/profile"
import { CommandInteraction } from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import { UnsupportedTokenError } from "errors/unsupported-token"
import { parseUnits } from "ethers/lib/utils"
import { embedsColors } from "types/common"
import { composeButtonLink } from "ui/discord/button"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  emojis,
  getAuthor,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  TokenEmojiKey,
} from "utils/common"
import {
  PREFIX_DISCORD_HANDLER,
  PREFIX_EMAIL_HANDLER,
  PREFIX_TELEGRAM_HANDLER,
  SPACES_REGEX,
} from "utils/constants"
import { reply } from "utils/discord"
import { isTokenSupported, parseMoniker } from "utils/tip-bot"

import { utils } from "@consolelabs/mochi-formatter"

import { parseDiscordToken } from "../../../utils/commands"
import { dmUser } from "../../../utils/dm"
import { getToken } from "../../../utils/tip-bot"

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
  // get profile id
  const p = await profile.getByDiscord(author.id)
  if (p.err) {
    throw new APIError({
      msgOrInteraction,
      description: `[getByDiscord] API error with status ${p.status_code}`,
      curl: p.curl,
      status: p.status ?? 500,
      error: p.error,
    })
  }

  const t = await getToken(token)

  const isDm = msgOrInteraction.channel?.type === "DM"
  let dm: any
  if (targets?.length) {
    const dmPayrequestMsg1 = composeEmbedMessage(null, {
      description: `Your payment request is created! Send this message to the friend to request the payment ${getEmoji(
        "ANIMATED_POINTING_DOWN",
        true,
      )}`,
      color: embedsColors.Payme,
      noFooter: true,
    })
    if (isDm) {
      await reply(msgOrInteraction, {
        messageOptions: {
          embeds: [dmPayrequestMsg1],
        },
      })
    } else {
      dm = await dmUser(
        {
          embeds: [dmPayrequestMsg1],
        },
        author,
        null,
        null,
      )
    }

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

      const content = [
        `Hey! ${author} requests you pay **${amount} ${token}**${
          note ? " with message:" : ""
        }`,
        ...(note ? [`\`${note}\``] : []),
        "",
        `You can pay me by using /tip ${author} ${amount} ${token} through ${
          msgOrInteraction.client.user
        } or via this pay link .[${res.data.code.substr(0, 5)}](${link})`,
      ].join("\n")

      await dmUser(
        {
          content: content,
        },
        author,
        null,
        null,
      )
    }
    if (!isDm) {
      await reply(msgOrInteraction, {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              description: `A new Pay Me request has been generated in your ${msgOrInteraction.client.user}, forward it to your payer!`,
              color: embedsColors.Payme,
            }),
          ],
          components: [composeButtonLink("See the DM", dm?.url ?? "")],
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
      author: [`[${res.data.code.substr(0, 5)}] New payment request`],
      thumbnail: `${getEmojiURL(emojis.BELL)}`,
      description: [
        `${getEmoji("PROPOSAL", false)}\`Pay link.   \`[${
          res.data.code
        }](${link})`,
        `${getEmoji("NFT", false)}\`Amount.     \`${
          moniker !== ""
            ? `**${utils.formatTokenDigit(
                original_amount,
              )} ${moniker}** \\( **${utils.formatTokenDigit(
                amount,
              )} ${token}** ≈ ${utils.formatUsdDigit(res.data.usd_amount)}\\)`
            : `${getEmojiToken(token, false)} **${utils.formatTokenDigit(
                amount,
              )} ${token}** \\(≈ ${utils.formatUsdDigit(
                res.data.usd_amount,
              )}\\)`
        }`,
        `${getEmoji("ANIMATED_MONEY", false)}\`Requester.  \`${author}`,
        note !== "" ? `${getEmoji("CHAT", false)}\`Message.    \`${note}` : "",
        ...(note !== "" ? [""] : []),
        `${getEmoji(
          "ANIMATED_POINTING_DOWN",
          true,
        )}You didn't mention who has to pay you. Copy the below message and send it to that person.`,
      ]
        .filter((line) => line !== undefined) // Remove undefined elements (empty lines)
        .join("\n"),
      originalMsgAuthor: author,
      color: embedsColors.Payme,
      noFooter: true,
    })

    let content = [
      `Hey! ${author} requests you pay **${amount} ${token}**${
        note ? " with message:" : ""
      }`,
      ...(note ? [`\`${note}\``] : []),
      "",
      `You can pay me by using /tip ${author} ${amount} ${token} through ${
        msgOrInteraction.client.user
      } or via this pay link .[${res.data.code.substr(0, 5)}](${link})`,
    ].join("\n")

    if (!isDm) {
      dm = await dmUser(
        {
          embeds: [dmPayrequestMsg1],
        },
        author,
        null,
        null,
      )
      await dmUser(
        {
          content: content,
        },
        author,
        null,
        null,
      )
      await reply(msgOrInteraction, {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              description: `Forward the Pay Me request from ${msgOrInteraction.client.user} to the payer, as the payer was not mentioned.`,
              color: embedsColors.Payme,
            }),
          ],
          components: [composeButtonLink("See the DM", dm?.url ?? "")],
        },
      })
    } else {
      await dmUser(
        {
          content: content,
        },
        author,
        null,
        null,
      )

      return reply(msgOrInteraction, {
        messageOptions: {
          embeds: [dmPayrequestMsg1],
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

export async function resolveTarget(
  interaction: CommandInteraction,
  receivers: string[],
) {
  if (!receivers) return
  const telegramUsernames: any[] = []
  const targetIds: { id: string; platform: string }[] = []

  for (const target of receivers) {
    if (PREFIX_DISCORD_HANDLER.some((handler) => target.startsWith(handler))) {
      const { value: targetId } = parseDiscordToken(target)
      const pfRes = await profile.getByDiscord(targetId)
      if (pfRes.error) {
        throw new InternalError({
          msgOrInteraction: interaction,
          description: "Couldn't get target user info",
        })
      }
      targetIds.push({ id: pfRes.id, platform: "discord" })
    }

    if (
      PREFIX_EMAIL_HANDLER.some((handler) => target.startsWith(handler)) ||
      isValidEmail(target)
    ) {
      const validMail = isValidEmail(target.replace(/^(mail:|email:)/, ""))
      if (!validMail) {
        throw new InternalError({
          msgOrInteraction: interaction,
          description: "Target email is in invalid format",
        })
      }
      const pfRes = await profile.getByEmail(
        target.replace(/(mail:|email:)/, ""),
      )
      if (pfRes.error) {
        throw new InternalError({
          msgOrInteraction: interaction,
          description: "Coulnd't get target user info",
        })
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
      throw new InternalError({
        msgOrInteraction: interaction,
        description: "Couldn't get user data",
      })
    }
  }

  return targetIds
}

export async function parsePaymeArgs(interaction: CommandInteraction): Promise<{
  targets: any
  amount: number
  token: string
  note: string
  moniker: string
  originalAmount: number
}> {
  let amount = interaction.options.getNumber("amount", true)
  let token = interaction.options.getString("token", true)
  const receivers =
    interaction.options.getString("target", false)?.split(SPACES_REGEX) ?? []
  const note = interaction.options.getString("note") ?? ""
  let parsedAmount = amount

  const targets = await resolveTarget(interaction, receivers)
  if (receivers?.length && targets?.length === 0) {
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
      msgOrInteraction: interaction as OriginalMessage,
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
