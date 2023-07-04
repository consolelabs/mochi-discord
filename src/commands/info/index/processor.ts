import defi from "adapters/defi"
import profile from "adapters/profile"
import { renderWallets } from "commands/profile/index/processor"
import {
  ButtonInteraction,
  CommandInteraction,
  EmbedFieldData,
  SelectMenuInteraction,
} from "discord.js"
import { APIError } from "errors"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import {
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  msgColors,
  resolveNamingServiceDomain,
  TokenEmojiKey,
} from "utils/common"
import { APPROX, MIN_DUST } from "utils/constants"
import { convertString } from "utils/convert"
import { formatDigit } from "utils/defi"
import { getProfileIdByDiscord } from "utils/profile"
import { chunk } from "lodash"

export enum BalanceType {
  All,
}

export enum BalanceView {
  Compact = 1,
  Expand,
}

const PAGE_SIZE = 20 as const

type Interaction =
  | CommandInteraction
  | SelectMenuInteraction
  | ButtonInteraction

export const balanceEmbedProps: Record<
  BalanceType,
  (
    discordId: string,
    profileId: string,
    address: string,
    interaction: Interaction
  ) => Promise<{
    title: string
    emoji: string
    description: string
    addressType?: string
    alias?: string
    address: string
  }>
> = {
  [BalanceType.All]: async () => ({
    address: "",
    title: "Mochi wallet",
    emoji: getEmojiURL(emojis.NFT2),
    description: `${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} You can withdraw using ${await getSlashCommand("withdraw")}.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} You can send tokens to other using ${await getSlashCommand("tip")}.`,
  }),
}

const balancesFetcher: Record<
  BalanceType,
  (
    profileId: string,
    discordId: string,
    address: string,
    type: string,
    platform: string
  ) => Promise<any>
> = {
  [BalanceType.All]: (profileId) => defi.getAllBalances({ profileId }),
}

export async function getBalances(
  profileId: string,
  discordId: string,
  type: BalanceType,
  msg: Interaction,
  address: string,
  addressType = "evm"
) {
  const fetcher = balancesFetcher[type]
  const res = await fetcher(profileId, discordId, address, addressType, "")
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: "Couldn't get balance",
    })
  }
  let data,
    farming: any,
    staking: any,
    lending: any,
    simple: any,
    nfts: any,
    pnl = 0
  if (type === BalanceType.All) {
    data = res.data.filter((i: any) => Boolean(i))
    pnl = 0
  }

  return {
    data,
    pnl,
    farming,
    staking,
    lending,
    simple,
    nfts,
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
}

export function formatView(
  view: "expand" | "compact",
  mode: "filter-dust" | "unfilter",
  balances: {
    token: {
      name: string
      symbol: string
      decimal: number
      price: number
      chain: { short_name?: string; name?: string; symbol?: string }
      native: boolean
    }
    amount: string
  }[],
  page: number
) {
  let totalWorth = 0
  const isDuplicateSymbol = (s: string) =>
    balances.filter((b: any) => b.token.symbol.toUpperCase() === s).length > 1
  if (view === "compact") {
    const formattedBal = balances
      .map((balance) => {
        const { token, amount } = balance
        const { symbol, chain: _chain, decimal, price, native } = token
        const tokenVal = convertString(amount, decimal)
        const usdVal = price * tokenVal
        const value = formatDigit({
          value: tokenVal.toString(),
          fractionDigits: tokenVal >= 1000 ? 0 : 2,
        })
        const usdWorth = formatDigit({
          value: usdVal.toString(),
          fractionDigits: usdVal > 100 ? 0 : 2,
        })
        let chain = _chain?.symbol || _chain?.short_name || _chain?.name || ""
        chain = chain.toLowerCase()
        if (tokenVal === 0 || (mode === "filter-dust" && usdVal <= MIN_DUST))
          return {
            emoji: "",
            text: "",
            usdVal: 0,
            usdWorth: 0,
            chain,
          }

        const text = `${value} ${symbol}`
        totalWorth += usdVal

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
      .filter((b) => b.text)
    const paginated = chunk(formattedBal, PAGE_SIZE)
    const { joined: text } = formatDataTable(
      (paginated[page] ?? []).map((b) => ({
        balance: `${b.text}${b.chain ? ` (${b.chain})` : ""}`,
        usd: `$${b.usdWorth}`,
      })),
      {
        cols: ["balance", "usd"],
        separator: [` ${APPROX} `],
        rowAfterFormatter: (formatted, i) =>
          `${formattedBal[i].emoji}${formatted}`,
      }
    )
    return { totalWorth, text, totalPage: paginated.length }
  } else {
    const fields: EmbedFieldData[] = balances
      .map((balance) => {
        const { token, amount } = balance
        const {
          name: tokenName,
          symbol,
          decimal,
          price,
          chain: _chain,
          native,
        } = token
        const tokenVal = convertString(amount, decimal)
        const usdVal = price * tokenVal
        const value = formatDigit({
          value: tokenVal.toString(),
          fractionDigits: tokenVal >= 1000 ? 0 : 2,
        })
        const usdWorth = formatDigit({
          value: usdVal.toString(),
          fractionDigits: usdVal > 100 ? 0 : 2,
        })
        let chain = _chain?.symbol || _chain?.short_name || _chain?.name || ""
        chain = chain.toLowerCase()

        totalWorth += usdVal
        if (tokenVal === 0 || (mode === "filter-dust" && usdVal <= MIN_DUST)) {
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
                ? ` (${chain})`
                : ""
            } `,
          value: `${getEmojiToken(
            symbol.toUpperCase() as TokenEmojiKey
          )} ${value} ${symbol} \`$${usdWorth}\` ${getEmoji("BLANK")}`,
          inline: true,
        }
      })
      .filter((f) => f?.name && f.value)
    const paginated = chunk(fields, PAGE_SIZE)
    return {
      totalWorth,
      fields: paginated[page] ?? [],
      totalPage: paginated.length,
    }
  }
}

async function switchView(
  view: BalanceView,
  props: { address: string; emoji: string; title: string; description: string },
  balances: {
    data: any[]
    farming: any[]
    staking: any[]
    lending: any[]
    simple: any[]
    pnl: number
  },
  discordId: string,
  balanceType: BalanceType,
  showFullEarn: boolean,
  isViewingOther: boolean,
  page: number
) {
  const wallet = await defi.findWallet(discordId, props.address)
  const trackingType = wallet?.data?.type
  const { mochiWallets, wallets } = await profile.getUserWallets(discordId)
  let isOwnWallet = wallets.some((w) =>
    props.address.toLowerCase().includes(w.value.toLowerCase())
  )
  isOwnWallet = isOwnWallet && !isViewingOther

  const embed = composeEmbedMessage(null, {
    author: [props.title, props.emoji],
    color: msgColors.SUCCESS,
  })

  embed.setDescription("")

  let totalWorth = 0
  let emptyText = ""
  let totalPage = 1

  if (view === BalanceView.Compact) {
    const {
      totalWorth: _totalWorth,
      text,
      totalPage: _totalPage,
    } = formatView("compact", "filter-dust", balances.data, page)
    totalWorth = _totalWorth
    totalPage = _totalPage

    if (text) {
      embed.setDescription(`**Balances**\n${text}`)
    } else {
      emptyText = `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} You have nothing yet, use ${await getSlashCommand(
        "earn"
      )} or ${await getSlashCommand("deposit")}\n\n`
    }
  } else {
    const {
      totalWorth: _totalWorth,
      fields = [],
      totalPage: _totalPage,
    } = formatView("expand", "filter-dust", balances.data, page)
    totalWorth = _totalWorth
    totalPage = _totalPage

    embed.addFields(fields)
  }

  if (balanceType === BalanceType.All) {
    const value = await renderWallets({
      mochiWallets: {
        data: mochiWallets,
        truncate: false,
      },
      wallets: {
        data: [],
      },
      cexes: {
        data: [],
      },
    })
    embed.setDescription(`**Wallets**\n${value}\n\n${embed.description}`)
  }

  embed.addFields([
    {
      name: `Total (U.S dollar)`,
      value: `${getEmoji("CASH")} \`$${formatDigit({
        value: totalWorth.toString(),
        fractionDigits: totalWorth > 100 ? 0 : 2,
      })}\``,
    },
  ])

  if (emptyText) {
    embed.setDescription(`${emptyText}${embed.description}`)
  } else if (isOwnWallet) {
    embed.setDescription(`${props.description}\n\n${embed.description}`)
  }

  return { embed, trackingType, isOwnWallet, totalPage }
}

export async function renderAllBalances(
  discordId: string,
  {
    interaction,
    type,
    address,
    view = BalanceView.Compact,
    showFullEarn = false,
    page = 0,
    balances: ctxBalances,
  }: {
    interaction: Interaction
    type: BalanceType
    address: string
    view?: BalanceView
    showFullEarn?: boolean
    balances?: any
    page?: number
  }
) {
  // handle name service
  const resolvedAddress = (await resolveNamingServiceDomain(address)) || address
  const profileId = await getProfileIdByDiscord(discordId)
  const { addressType, ...props } =
    (await balanceEmbedProps[type]?.(
      discordId,
      profileId,
      resolvedAddress,
      interaction
    )) ?? {}
  const [balances] = await Promise.all([
    // reuse data if there is data and not on 1st page
    ctxBalances && page !== 0
      ? ctxBalances
      : getBalances(
          profileId,
          discordId,
          type,
          interaction,
          resolvedAddress,
          addressType
        ),
  ])
  const isViewingOther = interaction.user.id !== discordId

  const { embed } = await switchView(
    view,
    props,
    balances,
    discordId,
    type,
    showFullEarn,
    isViewingOther,
    page
  )
  return {
    context: {
      address,
      type,
      chain: addressType,
      showFullEarn,
      page,
      balances,
    },
    msgOpts: {
      embeds: [embed],
    },
  }
}
