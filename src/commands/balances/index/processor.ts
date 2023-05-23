import {
  ButtonInteraction,
  CommandInteraction,
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { APIError, OriginalMessage } from "errors"
import { composeEmbedMessage, justifyEmbedFields } from "ui/discord/embed"
import {
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  msgColors,
  TokenEmojiKey,
} from "utils/common"
import { APPROX } from "utils/constants"
import mochiPay from "../../../adapters/mochi-pay"
import { convertString } from "../../../utils/convert"
import { formatDigit } from "../../../utils/defi"
import { getProfileIdByDiscord } from "../../../utils/profile"

export const balanceTypes: Record<string, number> = {
  Offchain: 1,
  Onchain: 2,
  Total: 3,
}

const balanceEmbedProps = {
  [balanceTypes.Offchain]: {
    title: "Mochi balance",
    description: `${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} You can withdraw the coin to you crypto wallet by \`$withdraw\`.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} All the tip transaction will take from this balance. You can try \`$tip <recipient> <amount> <token>\` to transfer coin.`,
  },
  [balanceTypes.Onchain]: {
    title: "Onchain balance",
    description: `This balance shows the total amount of pending on-chain transactions.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} You can transfer received token to your crypto wallet by claiming in your DM \`$claim <Claim ID> <your recipient address>\`.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} All the tip transaction won't take from this balance.`,
  },
  [balanceTypes.Total]: {
    title: "Total",
    description: "This balance including both onchain and offchain balance.",
  },
}

// TODO: temporarily disable onchain balances
const balancesFetcher: Record<number, (profileId: string) => Promise<any>[]> = {
  [balanceTypes.Offchain]: (profileId) => [
    // Defi.offchainGetUserBalances({ userId }),
    mochiPay.getBalances({ profileId }),
  ],
  // [balanceTypes.Onchain]: (userId) => [Defi.getUserOnchainBalances(userId)],
  // [balanceTypes.Total]: (userId) => [
  //   Defi.offchainGetUserBalances({ userId }),
  //   Defi.getUserOnchainBalances(userId),
  // ],
}

export async function getBalances(
  userId: string,
  type: number,
  msg: OriginalMessage
) {
  const fetcher = balancesFetcher[type]
  const res = await Promise.all(fetcher(userId))
  const ok = res[0].ok && (res[1]?.ok ?? true)
  if (!ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res[0].curl,
      description: "Couldn't get balance",
    })
  }
  return res[0].data.concat(res[1]?.data).filter((i: any) => Boolean(i))
}

export async function handleBalanceView(i: ButtonInteraction) {
  if (!i.deferred) {
    await i.deferUpdate()
  }
  const [, view, profileId, type] = i.customId.split("_")
  const msg = i.message as Message
  const balances = await getBalances(profileId, Number(type), msg)

  const props = balanceEmbedProps[Number(type)]

  if (!balances.length) {
    const embed = composeEmbedMessage(null, {
      author: [props.title, getEmojiURL(emojis.WALLET)],
      description: "No balance. Try `$deposit` more into your wallet.",
      color: msgColors.SUCCESS,
    })
    i.editReply({
      embeds: [embed],
    })
    return
  }

  i.editReply({
    embeds: [switchView(view as any, props, balances)],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setEmoji(
            getEmoji(
              view === "expand" ? "ANIMATED_COIN_2" : "ANIMATED_COIN_3",
              true
            )
          )
          .setStyle("SECONDARY")
          .setCustomId(
            `balance-view_${
              view === "expand" ? "compact" : "expand"
            }_${profileId}_${type}`
          )
          .setLabel(view === "expand" ? "Compact" : "Expand")
      ),
    ],
  })
}

export function formatView(
  view: "expand" | "compact",
  balances: {
    token: {
      name: string
      symbol: string
      decimal: number
      price: number
      chain: { name: string }
      native: boolean
    }
    amount: string
  }[],
  customProvider?: (balance: any) => {
    symbol: string
    text: string
    usd: number
    chain?: {
      name: string
    }
  }
) {
  let totalWorth = 0
  let longestStrLen = 0
  const isDuplicateSymbol = (s: string) =>
    balances.filter((b: any) => b.token.symbol.toUpperCase() === s).length > 1
  if (view === "compact") {
    const text = balances
      .map((balance) => {
        const customVal = customProvider?.(balance)
        if (customVal) {
          longestStrLen = Math.max(longestStrLen, customVal.text.length)
          totalWorth += customVal.usd
          return {
            chain: customVal.chain,
            usdWorth: formatDigit({
              value: customVal.usd.toString(),
              fractionDigits: 4,
            }),
            text: customVal.text,
            emoji: getEmojiToken(
              customVal.symbol.toUpperCase() as TokenEmojiKey
            ),
          }
        }
        const { token, amount } = balance
        const { symbol, chain, decimal, price, native } = token
        const tokenVal = convertString(amount, decimal)
        const usdVal = price * tokenVal
        const value = formatDigit({ value: tokenVal.toString() })
        const usdWorth = formatDigit({
          value: usdVal.toString(),
          fractionDigits: 4,
        })
        //
        totalWorth += usdVal
        const text = `${value} ${symbol}`
        longestStrLen = Math.max(longestStrLen, text.length)
        if (tokenVal === 0) return { emoji: "", text: "" }

        return {
          emoji: getEmojiToken(symbol.toUpperCase() as TokenEmojiKey),
          text,
          usdWorth,
          ...(chain && !native && isDuplicateSymbol(symbol.toUpperCase())
            ? { chain }
            : {}),
        }
      })
      .map((e: any) => {
        if (!e.text) return ""
        return `${e.emoji} \`${e.text}${" ".repeat(
          longestStrLen - e.text.length
        )} ${APPROX} $${e.usdWorth}${e.chain ? ` (${e.chain.name})` : ""}\``
      })
      .filter(Boolean)
      .join("\n")
    return { totalWorth, text }
  } else {
    const fields: EmbedFieldData[] = balances
      .map((balance) => {
        const { token, amount } = balance
        const { name: tokenName, symbol, decimal, price, chain, native } = token
        const tokenVal = convertString(amount, decimal)
        const usdVal = price * tokenVal
        const value = formatDigit({ value: tokenVal.toString() })
        const usdWorth = formatDigit({
          value: usdVal.toString(),
          fractionDigits: 4,
        })
        totalWorth += usdVal
        if (tokenVal === 0) {
          return {
            name: "",
            value: "",
          }
        }

        return {
          name:
            tokenName +
            `${
              chain && !native && isDuplicateSymbol(symbol.toUpperCase())
                ? ` (${chain.name})`
                : ""
            } `,
          value: `${getEmojiToken(
            symbol.toUpperCase() as TokenEmojiKey
          )} ${value} ${symbol} \`$${usdWorth}\` ${getEmoji("BLANK")}`,
          inline: true,
        }
      })
      .filter((f) => f?.name && f.value)
    return { totalWorth, fields }
  }
}

function switchView(
  view: "compact" | "expand",
  props: { title: string; description: string },
  balances: any
) {
  const embed = composeEmbedMessage(null, {
    author: [props.title, getEmojiURL(emojis.WALLET)],
    color: msgColors.SUCCESS,
  })

  let totalWorth = 0
  if (view === "compact") {
    const { totalWorth: _totalWorth, text = "" } = formatView(
      "compact",
      balances
    )
    totalWorth = _totalWorth
    embed.setDescription(`${props.description}\n\n${text}`)
  } else {
    const { totalWorth: _totalWorth, fields = [] } = formatView(
      "expand",
      balances
    )
    totalWorth = _totalWorth
    embed.setDescription(props.description).addFields(fields)
  }

  embed.addFields({
    name: `Total (U.S dollar)`,
    value: `${getEmoji("CASH")} \`$${formatDigit({
      value: totalWorth.toString(),
    })}\``,
  })
  return embed
}

export async function renderBalances(
  discordId: string,
  msg: Message | CommandInteraction,
  type: number
) {
  const profileId = await getProfileIdByDiscord(discordId)
  const balances = await getBalances(profileId, type, msg)
  const blank = getEmoji("BLANK")
  let totalWorth = 0
  const fields: EmbedFieldData[] = balances
    ?.map((balance: any) => {
      const { token, amount } = balance
      const { name: tokenName, symbol, decimal, price, chain, native } = token
      const tokenVal = convertString(amount, decimal)
      const usdVal = price * tokenVal
      const value = formatDigit({ value: tokenVal.toString() })
      const usdWorth = formatDigit({
        value: usdVal.toString(),
        fractionDigits: 4,
      })
      totalWorth += usdVal
      if (tokenVal === 0) return

      return {
        name: tokenName + `${chain && !native ? ` (${chain.name})` : ""}`,
        value: `${getEmojiToken(
          symbol.toUpperCase()
        )} ${value} ${symbol} \`$${usdWorth}\` ${blank}`,
        inline: true,
      }
    })
    .filter((f: EmbedFieldData | undefined) => Boolean(f))

  const props = balanceEmbedProps[type]
  if (!balances.length) {
    const embed = composeEmbedMessage(null, {
      author: [props.title, getEmojiURL(emojis.WALLET)],
      description: "No balance. Try `$deposit` more into your wallet.",
      color: msgColors.SUCCESS,
    })
    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  }

  const embed = composeEmbedMessage(null, {
    author: [props.title, getEmojiURL(emojis.WALLET)],
    description: props.description,
    color: msgColors.SUCCESS,
  }).addFields(fields)
  justifyEmbedFields(embed, 3)
  embed.addFields({
    name: `Estimated total (U.S dollar)`,
    value: `${getEmoji("CASH")} \`$${formatDigit({
      value: totalWorth.toString(),
    })}\``,
  })

  return {
    messageOptions: {
      embeds: [switchView("compact", props, balances)],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setEmoji(getEmoji("ANIMATED_COIN_3", true))
            .setStyle("SECONDARY")
            .setCustomId(`balance-view_expand_${profileId}_${type}`)
            .setLabel("Expand")
        ),
      ],
    },
  }
}
