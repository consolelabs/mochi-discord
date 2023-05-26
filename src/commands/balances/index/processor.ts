import defi from "adapters/defi"
import profile from "adapters/profile"
import { renderWallets } from "commands/profile/index/processor"
import { buildRecentTxFields } from "commands/vault/info/processor"
import {
  ButtonInteraction,
  EmbedFieldData,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import {
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  isAddress,
  msgColors,
  resolveNamingServiceDomain,
  shortenHashOrAddress,
  TokenEmojiKey,
} from "utils/common"
import { APPROX, MIN_DUST } from "utils/constants"
import mochiPay from "../../../adapters/mochi-pay"
import { convertString } from "../../../utils/convert"
import { formatDigit } from "../../../utils/defi"
import { getProfileIdByDiscord } from "../../../utils/profile"

export enum BalanceType {
  Offchain = 1,
  Onchain,
}

const balanceEmbedProps: Record<
  BalanceType,
  (
    discordId: string,
    profileId: string,
    address: string,
    message: OriginalMessage
  ) => Promise<{
    title: string
    emoji: string
    description: string
    addressType?: string
    alias?: string
    address: string
  }>
> = {
  [BalanceType.Offchain]: async () => ({
    address: "",
    title: "Mochi wallet",
    emoji: getEmojiURL(emojis.NFT2),
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
  [BalanceType.Onchain]: async (discordId, _, addressOrAlias, message) => {
    const {
      data: wallet,
      ok,
      status,
      log,
      curl,
    } = await defi.findWallet(discordId, addressOrAlias)

    if (!ok && status !== 404) {
      throw new APIError({ msgOrInteraction: message, description: log, curl })
    }
    let address, addressType
    if (!ok) {
      // 1. address/alias not tracked yet
      address = addressOrAlias
      const { valid, type } = isAddress(address)
      if (!valid) {
        throw new InternalError({
          msgOrInteraction: message,
          title: "Invalid address",
          description:
            "Your wallet address is invalid. Make sure that the wallet address is valid, you can copy-paste it to ensure the exactness of it.",
        })
      }
      addressType = type
    } else {
      // 2. address/alias is being tracked
      address = wallet.address
      addressType = wallet.type || "eth"
    }
    return {
      addressType,
      address,
      alias: wallet?.alias,
      title: `${wallet?.alias ?? shortenHashOrAddress(address)}'s wallet`,
      emoji: getEmojiURL(emojis.WALLET_1),
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
    }
  },
}

const balancesFetcher: Record<
  BalanceType,
  (
    profileId: string,
    discordId: string,
    address: string,
    type: string
  ) => Promise<any>
> = {
  [BalanceType.Offchain]: (profileId) => mochiPay.getBalances({ profileId }),
  [BalanceType.Onchain]: (_, discordId, address, type) =>
    defi.getWalletAssets(discordId, address, type),
}

export async function getBalances(
  profileId: string,
  type: BalanceType,
  msg: OriginalMessage,
  address: string,
  addressType: string
) {
  const fetcher = balancesFetcher[type]
  const res = await fetcher(
    profileId,
    msg.member?.user.id ?? "",
    address,
    addressType
  )
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: "Couldn't get balance",
    })
  }
  let data, pnl
  if (type === 1) {
    data = res.data.filter((i: any) => Boolean(i))
    pnl = 0
  } else {
    data = res.data.balance.filter((i: any) => Boolean(i))
    pnl = res.data.pnl
  }

  return {
    data,
    pnl,
  }
}

const txnsFetcher: Record<
  BalanceType,
  (
    profileId: string,
    discordId: string,
    address: string,
    type: string
  ) => Promise<any>
> = {
  [BalanceType.Offchain]: (profile_id) => mochiPay.getListTx({ profile_id }),
  [BalanceType.Onchain]: (_, discordId, address, type) =>
    defi.getWalletTxns(discordId, address, type),
}

async function getTxns(
  profileId: string,
  type: BalanceType,
  msg: OriginalMessage,
  address: string,
  addressType: string
) {
  const fetcher = txnsFetcher[type]
  const res = await fetcher(
    profileId,
    msg.member?.user.id ?? "",
    address,
    addressType
  )
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: "Couldn't get txn",
    })
  }

  if (type === 1) {
    const data = res.data
    const sort = (a: any, b: any) => {
      const timeA = new Date(a.created_at).getTime()
      const timeB = new Date(b.created_at).getTime()
      return timeA - timeB
    }

    return [
      ...data.offchain.sort(sort).map((tx: any) => ({
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
      ...data.withdraw.sort(sort).map((tx: any) => ({
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
      ...data.deposit.sort(sort).map((tx: any) => ({
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
  } else {
    return (res.data ?? [])
      .filter(
        (d: any) =>
          d.has_transfer &&
          d.successful &&
          d.actions.some((a: any) => a.native_transfer || a.name === "Transfer")
      )
      .map((d: any) => {
        const date = d.signed_at
        const firstAction = d.actions.find(
          (a: any) => a.native_transfer || a.name === "Transfer"
        )
        const action =
          firstAction.to.toLowerCase() === address.toLowerCase()
            ? "Received"
            : "Sent"
        const target = firstAction.to
        const amount = formatDigit({
          value: firstAction.amount,
          fractionDigits: 4,
        })
        const token = firstAction.unit

        return {
          date,
          action,
          target,
          amount,
          token,
        }
      })
      .slice(0, 5)
  }
}

export async function handleInteraction(i: ButtonInteraction) {
  if (!i.deferred) {
    await i.deferUpdate()
  }
  if (i.customId !== "back") {
    i.followUp({ content: "WIP!", ephemeral: true })
  }
  return
  // const [, view, profileId, type] = i.customId.split("_")
  // const msg = i.message as Message
  // const balances = await getBalances(profileId, Number(type), msg)
  //
  // const props = await balanceEmbedProps[Number(type)]?.()
  //
  // if (!balances.length) {
  //   const embed = composeEmbedMessage(null, {
  //     author: [props.title, getEmojiURL(emojis.NFT2)],
  //     description: "No balance. Try `$deposit` more into your wallet.",
  //     color: msgColors.SUCCESS,
  //   })
  //   i.editReply({
  //     embeds: [embed],
  //   })
  //   return
  // }
  //
  // i.editReply({
  //   embeds: [await switchView(view as any, props, balances, i.user.id)],
  // })
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
            usdVal: customVal.usd,
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
        const value = formatDigit({
          value: tokenVal.toString(),
          fractionDigits: 4,
        })
        const usdWorth = formatDigit({
          value: usdVal.toString(),
          fractionDigits: 2,
        })
        //
        if (tokenVal === 0 || usdVal <= MIN_DUST)
          return { emoji: "", text: "", usdVal: 0 }

        const text = `${value} ${symbol}`
        totalWorth += usdVal
        longestStrLen = Math.max(longestStrLen, text.length)

        return {
          emoji: getEmojiToken(symbol.toUpperCase() as TokenEmojiKey),
          text,
          usdWorth,
          usdVal,
          ...(chain && !native && isDuplicateSymbol(symbol.toUpperCase())
            ? { chain }
            : {}),
        }
      })
      .sort((a, b) => {
        return b.usdVal - a.usdVal
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
        const value = formatDigit({
          value: tokenVal.toString(),
          fractionDigits: 4,
        })
        const usdWorth = formatDigit({
          value: usdVal.toString(),
          fractionDigits: 2,
        })
        totalWorth += usdVal
        if (tokenVal === 0 || usdVal <= MIN_DUST) {
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
  props: { address: string; emoji: string; title: string; description: string },
  balances: { data: any[]; pnl: string },
  txns: any,
  discordId: string,
  balanceType: number
) {
  const embed = composeEmbedMessage(null, {
    author: [props.title, props.emoji],
    color: msgColors.SUCCESS,
  })

  let totalWorth = 0
  if (view === "compact") {
    const { totalWorth: _totalWorth, text: _text } = formatView(
      "compact",
      balances.data
    )
    const text =
      _text ||
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} You have nothing yet, use </earn:${await getSlashCommand(
        "earn"
      )}> or </deposit:${await getSlashCommand("deposit")}>`
    totalWorth = _totalWorth
    embed.setDescription(`${_text ? `${props.description}\n\n` : ""}${text}`)
  } else {
    const { totalWorth: _totalWorth, fields = [] } = formatView(
      "expand",
      balances.data
    )
    totalWorth = _totalWorth
    embed.setDescription(props.description).addFields(fields)
  }

  embed.addFields([
    {
      name: `Total (U.S dollar)`,
      value: `${getEmoji("CASH")} \`$${formatDigit({
        value: totalWorth.toString(),
        fractionDigits: 2,
      })}\`${
        balanceType === 2
          ? ` (${getEmoji(
              balances.pnl.split("")[0] === "-"
                ? "ANIMATED_ARROW_DOWN"
                : "ANIMATED_ARROW_UP",
              true
            )}${formatDigit({
              value: balances.pnl.slice(1),
              fractionDigits: 2,
            })}%)`
          : ""
      }`,
    },
    ...(!txns.length ? [] : buildRecentTxFields({ recent_transaction: txns })),
  ])

  const { mochiWallets, wallets } = await profile.getUserWallets(discordId)
  const preventEmptyVal = "\u200b"
  if (balanceType === 1) {
    embed.spliceFields(1, 0, {
      name: "Wallets",
      value:
        (await renderWallets({
          mochiWallets: {
            data: mochiWallets,
          },
          wallets: {
            data: [],
          },
        })) + preventEmptyVal,
      inline: false,
    })
  } else {
    console.log(discordId, props.address)
    const value = await renderWallets({
      mochiWallets: {
        data: [],
      },
      wallets: {
        data: wallets.filter(
          (w) => w.value.toLowerCase() === props.address.toLowerCase()
        ),
      },
    })
    embed.spliceFields(1, 0, {
      name: "Wallet",
      value: value + preventEmptyVal,
      inline: false,
    })
  }

  return embed
}

export async function renderBalances(
  discordId: string,
  msg: OriginalMessage,
  type: BalanceType,
  address: string,
  view: "compact" | "expand" = "compact"
) {
  // handle name service
  const resolvedAddress = (await resolveNamingServiceDomain(address)) || address
  const profileId = await getProfileIdByDiscord(discordId)

  const { addressType, ...props } =
    (await balanceEmbedProps[type]?.(
      discordId,
      profileId,
      resolvedAddress,
      msg
    )) ?? {}

  const [balances, txns] = await Promise.all([
    getBalances(profileId, type, msg, resolvedAddress, addressType ?? "eth"),
    getTxns(profileId, type, msg, resolvedAddress, addressType ?? "eth"),
  ])

  return {
    messageOptions: {
      embeds: [await switchView(view, props, balances, txns, discordId, type)],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setStyle("SECONDARY")
            .setEmoji("<a:brrr:902558248907980871>")
            .setCustomId(`balance_earn`)
            .setLabel("Earn"),
          ...getButtons("balance", `_${profileId}_${type}`)
        ),
      ],
    },
  }
}

export function getButtons(prefix: string, suffix = "") {
  return [
    new MessageButton()
      .setStyle("SECONDARY")
      .setEmoji(getEmoji("SHARE"))
      .setCustomId(`${prefix}_send${suffix}`)
      .setLabel("Send"),
    new MessageButton()
      .setStyle("SECONDARY")
      .setEmoji(getEmoji("ANIMATED_TOKEN_ADD", true))
      .setCustomId(`${prefix}_deposit${suffix}`)
      .setLabel("Deposit"),
    new MessageButton()
      .setStyle("SECONDARY")
      .setCustomId(`${prefix}_invest${suffix}`)
      .setEmoji(getEmoji("BANK"))
      .setLabel("Invest"),
  ]
}
