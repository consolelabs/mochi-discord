import profile from "adapters/profile"
import { renderWallets } from "commands/profile/index/processor"
import { buildRecentTxFields } from "commands/vault/info/processor"
import {
  ButtonInteraction,
  CommandInteraction,
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { APIError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
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

export const balanceTypes = {
  Offchain: 1,
  Onchain: 2,
  Total: 3,
}

const balanceEmbedProps = {
  [balanceTypes.Offchain]: async () => ({
    title: "Mochi balance",
    description: `${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} You can withdraw using </withdraw:${await getSlashCommand(
      "withdraw"
    )}>.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} You can send tokens to other using </tip:${await getSlashCommand(
      "tip"
    )}>.`,
  }),
  [balanceTypes.Onchain]: () => ({
    title: "Onchain balance",
    description: `This balance shows the total amount of pending on-chain transactions.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} You can transfer received token to your crypto wallet by claiming in your DM \`$claim <Claim ID> <your recipient address>\`.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} All the tip transaction won't take from this balance.`,
  }),
  [balanceTypes.Total]: () => ({
    title: "Total",
    description: "This balance including both onchain and offchain balance.",
  }),
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
  profileId: string,
  type: number,
  msg: OriginalMessage
) {
  const fetcher = balancesFetcher[type]
  const res = await Promise.all(fetcher(profileId))
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

  const props = await balanceEmbedProps[Number(type)]?.()

  if (!balances.length) {
    const embed = composeEmbedMessage(null, {
      author: [props.title, getEmojiURL(emojis.NFT2)],
      description: "No balance. Try `$deposit` more into your wallet.",
      color: msgColors.SUCCESS,
    })
    i.editReply({
      embeds: [embed],
    })
    return
  }

  i.editReply({
    embeds: [await switchView(view as any, props, balances, i.user.id)],
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
              fractionDigits: 2,
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
          fractionDigits: 2,
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
          fractionDigits: 2,
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

async function switchView(
  view: "compact" | "expand",
  props: { title: string; description: string },
  balances: any,
  discordId: string
) {
  const profileData = await profile.getByDiscord(discordId)
  const { data: txnsRes, ok: txnOk } = await mochiPay.getListTx({
    profile_id: profileData.id,
  })
  let txns = { offchain: [], deposit: [], withdraw: [] }
  if (txnOk) {
    txns = txnsRes as any
  }
  const { mochiWallets } = await profile.getUserWallets(discordId)
  const embed = composeEmbedMessage(null, {
    author: [props.title, getEmojiURL(emojis.NFT2)],
    color: msgColors.SUCCESS,
  })

  let totalWorth = 0
  let isNew = false
  if (view === "compact") {
    const { totalWorth: _totalWorth, text: _text } = formatView(
      "compact",
      balances
    )
    if (!_text) {
      isNew = true
    }
    const text =
      _text ||
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} You have nothing yet, use </earn:${await getSlashCommand(
        "earn"
      )}> or </deposit:${await getSlashCommand("deposit")}>\n\u200b`
    totalWorth = _totalWorth
    embed.setDescription(`${_text ? `${props.description}\n\n` : ""}${text}`)
  } else {
    const { totalWorth: _totalWorth, fields = [] } = formatView(
      "expand",
      balances
    )
    totalWorth = _totalWorth
    embed.setDescription(props.description).addFields(fields)
  }

  const sort = (a: any, b: any) => {
    const timeA = new Date(a.created_at).getTime()
    const timeB = new Date(b.created_at).getTime()
    return timeA - timeB
  }

  const txList = [
    ...txns.offchain.sort(sort).map((tx: any) => ({
      date: tx.created_at,
      action: tx.type === "credit" ? "Received" : "Sent",
      target: tx.other_profile_id,
      amount: formatDigit({
        value: convertString(
          tx.amount,
          tx.token?.decimal ?? 18,
          false
        ).toString(),
        fractionDigits: 4,
      }),
      token: tx.token?.symbol?.toUpperCase() ?? "",
    })),
    ...txns.withdraw.sort(sort).map((tx: any) => ({
      date: tx.created_at,
      action: "Sent",
      target: tx.address,
      amount: formatDigit({
        value: convertString(
          tx.amount,
          tx.token?.decimal ?? 18,
          false
        ).toString(),
        fractionDigits: 4,
      }),
      token: tx.token?.symbol?.toUpperCase() ?? "",
    })),
    ...txns.deposit.sort(sort).map((tx: any) => ({
      date: tx.created_at,
      action: "Received",
      target: tx.from,
      amount: formatDigit({
        value: convertString(
          tx.amount,
          tx.token?.decimal ?? 18,
          false
        ).toString(),
        fractionDigits: 4,
      }),
      token: tx.token?.symbol?.toUpperCase() ?? "",
    })),
  ].slice(0, 5)

  embed.addFields([
    {
      name: "Wallets",
      value: await renderWallets({
        mochiWallets: {
          data: mochiWallets,
        },
        wallets: {
          data: [],
        },
      }),
      inline: false,
    },
    {
      name: `Total (U.S dollar)`,
      value: `${getEmoji("CASH")} \`$${formatDigit({
        value: totalWorth.toString(),
        fractionDigits: 2,
      })}\``,
    },
    ...(isNew || !txList.length
      ? []
      : buildRecentTxFields({ recent_transaction: txList })),
  ])
  return embed
}

export async function renderBalances(
  discordId: string,
  msg: Message | CommandInteraction,
  type: number
) {
  const profileId = await getProfileIdByDiscord(discordId)
  const balances = await getBalances(profileId, type, msg)

  const props = await balanceEmbedProps[type]?.()

  return {
    messageOptions: {
      embeds: [
        await switchView("compact", props, balances, msg.member?.user.id ?? ""),
      ],
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
