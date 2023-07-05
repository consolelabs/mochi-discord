import defi from "adapters/defi"
import profile from "adapters/profile"
import { renderWallets } from "commands/profile/index/processor"
import { buildRecentTxFields } from "commands/vault/info/processor"
import {
  ButtonInteraction,
  CommandInteraction,
  EmbedFieldData,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  SelectMenuInteraction,
  User,
} from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import {
  composeEmbedMessage,
  formatDataTable,
  getSuccessEmbed,
} from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import {
  AddressChainType,
  EmojiKey,
  emojis,
  equalIgnoreCase,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  isAddress,
  isValidRoninAddress,
  msgColors,
  resolveNamingServiceDomain,
  shortenHashOrAddress,
  TokenEmojiKey,
} from "utils/common"
import {
  APPROX,
  MIN_DUST,
  TRACKING_TYPE_FOLLOW,
  TRACKING_TYPE_COPY,
  TRACKING_TYPE_TRACK,
  VERTICAL_BAR,
} from "utils/constants"
import mochiPay from "adapters/mochi-pay"
import { convertString } from "utils/convert"
import { formatDigit } from "utils/defi"
import { getProfileIdByDiscord } from "utils/profile"
import { BigNumber } from "ethers"
import { chunk, groupBy } from "lodash"
import { paginationButtons } from "utils/router"

export enum BalanceType {
  Offchain = 1,
  Onchain,
  Cex,
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
  [BalanceType.Offchain]: async () => ({
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
  [BalanceType.Onchain]: async (discordId, _, addressOrAlias, interaction) => {
    const {
      data: wallet,
      ok,
      status,
      log,
      curl,
    } = await defi.findWallet(discordId, addressOrAlias)

    if (!ok && status !== 404) {
      throw new APIError({
        msgOrInteraction: interaction,
        description: log,
        curl,
      })
    }
    let address, addressType
    if (!ok) {
      // 1. address/alias not tracked yet
      address = addressOrAlias
      const { valid, chainType } = isAddress(address)
      if (!valid) {
        throw new InternalError({
          msgOrInteraction: interaction,
          title: "Invalid address",
          description:
            "Your wallet address is invalid. Make sure that the wallet address is valid, you can copy-paste it to ensure the exactness of it.",
        })
      }
      addressType = chainType
    } else {
      // 2. address/alias is being tracked
      address = wallet.address
      addressType = wallet.chain_type || "evm"
    }
    return {
      addressType,
      address,
      alias: wallet?.alias,
      title: `${wallet?.alias || shortenHashOrAddress(address)}'s wallet`,
      emoji: getEmojiURL(emojis.WALLET_2),
      description: `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} You can withdraw using ${await getSlashCommand(
        "withdraw"
      )}.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} You can send tokens to other using ${await getSlashCommand("tip")}.`,
    }
  },
  // TODO
  [BalanceType.Cex]: () =>
    Promise.resolve({
      address: "",
      title: "Binance Data",
      emoji: getEmojiURL(emojis.NFT2),
      description: ``,
    }),
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
  [BalanceType.Offchain]: (profileId) => mochiPay.getBalances({ profileId }),
  [BalanceType.Onchain]: (_, discordId, address, type) =>
    defi.getWalletAssets(discordId, address, type),
  [BalanceType.Cex]: (profileId, platform) =>
    defi.getDexAssets({ profileId: profileId, platform: platform }),
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
  if (type === BalanceType.Offchain) {
    data = res.data.filter((i: any) => Boolean(i))
    pnl = 0
  }
  if (type == BalanceType.All) {
    data = res.data.filter((i: any) => Boolean(i))
    pnl = 0
  }
  if (type === BalanceType.Onchain) {
    data = res.data.balance.filter((i: any) => Boolean(i))
    pnl = Number(res.data.pnl || 0)
    if (Number.isNaN(pnl)) {
      pnl = 0
    }
    farming = res.data.farming
    staking = res.data.staking
    nfts = res.data.nfts
  }
  if (type === BalanceType.Cex) {
    data = res.data.asset.filter((i: any) => Boolean(i))
    pnl = 0
    const groupedEarn = groupBy(res.data.earn ?? [], (e) => {
      if (e.detail_staking) return "staking"
      if (e.detail_lending) return "lending"
      return "unknown"
    })
    staking =
      groupedEarn.staking?.map((e: any) => ({
        amount: +e.detail_staking.amount,
        price: e.token.price,
        reward: +e.detail_staking.rewardAmt,
        symbol: e.token.symbol,
      })) ?? []

    lending =
      groupedEarn.lending?.map((e) => ({
        amount: +e.detail_lending.amount,
        price: e.token.price,
        reward: 0,
        symbol: e.token.symbol,
      })) ?? []

    if (res.data.simple_earn) {
      simple = [
        {
          amount: +res.data.simple_earn.total_amount_in_btc,
          price: +res.data.simple_earn.btc_price,
          reward: 0,
          symbol: "BTC",
        },
      ]
    }
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

const txnsFetcher: Record<
  BalanceType,
  (
    profileId: string,
    discordId: string,
    address: string,
    type: string,
    platform: string
  ) => Promise<any>
> = {
  [BalanceType.Offchain]: (profile_id) => mochiPay.getListTx({ profile_id }),
  [BalanceType.Onchain]: (_, discordId, address, type) =>
    defi.getWalletTxns(discordId, address, type),
  [BalanceType.Cex]: (profile_id, platform) =>
    defi.getDexTxns(profile_id, platform),
  [BalanceType.All]: (profile_id) => mochiPay.getListTx({ profile_id }),
}

async function getTxns(
  profileId: string,
  discordId: string,
  type: BalanceType,
  msg: Interaction,
  address: string,
  addressType = "evm"
) {
  // TODO: implement later
  if (type === BalanceType.Cex) {
    return []
  }
  const fetcher = txnsFetcher[type]
  const res = await fetcher(profileId, discordId, address, addressType, "")
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: "Couldn't get txn",
    })
  }

  if (type === BalanceType.Offchain) {
    const data = res.data
    const sort = (a: any, b: any) => {
      const timeA = new Date(a.created_at).getTime()
      const timeB = new Date(b.created_at).getTime()
      return timeB - timeA
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
  }
  if (type === BalanceType.Onchain) {
    const data = res.data || []
    return data
      .filter(
        (d: any) =>
          d.has_transfer &&
          d.successful &&
          d.actions?.some(
            (a: any) => a.native_transfer || equalIgnoreCase(a.name, "Transfer")
          )
      )
      .map((d: any) => {
        const date = d.signed_at
        const firstAction = d.actions?.find(
          (a: any) => a.native_transfer || a.name === "Transfer"
        )
        if (!firstAction) return
        if (isValidRoninAddress(address)) {
          address = `0x${address.slice(6)}`
        }
        const target = firstAction.to
        const action =
          target.toLowerCase() === address.toLowerCase() ? "Received" : "Sent"
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
      .filter(Boolean)
      .slice(0, 5)
  }

  return []
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
  txns: any,
  discordId: string,
  balanceType: BalanceType,
  showFullEarn: boolean,
  isViewingOther: boolean,
  page: number,
  profileId: string
) {
  const wallet = await defi.findWallet(discordId, props.address)
  const trackingType = wallet?.data?.type
  const { mochiWallets, wallets, cexes } = await profile.getUserWallets(
    discordId
  )
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
      embed.setDescription(`**Spot**\n${text}`)
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

  if (balanceType === BalanceType.Offchain) {
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
  if (balanceType === BalanceType.Onchain) {
    const value = await renderWallets({
      mochiWallets: {
        data: [],
      },
      cexes: {
        data: [],
      },
      wallets: {
        data: [
          {
            chain: isAddress(props.address).chainType,
            value: props.address,
          },
        ],
        truncate: false,
      },
    })

    embed.setDescription(`**Wallet**\n${value}\n\n${embed.description}`)

    // farming
    const { field: farmingField, total: totalFarm } = buildFarmingField(
      balances.farming,
      showFullEarn
    )
    // staking
    const { field: stakingField, total: totalStake } = buildEarnField(
      "Staking",
      balances.staking,
      showFullEarn
    )
    totalWorth += totalFarm + totalStake

    if (stakingField) {
      embed.addFields(stakingField)
    }

    if (farmingField) {
      embed.addFields(farmingField)
    }
  }

  if (balanceType === BalanceType.Cex) {
    const value = await renderWallets({
      mochiWallets: {
        data: [],
      },
      cexes: {
        data: cexes,
        truncate: false,
      },
      wallets: {
        data: [],
      },
    })

    embed.setDescription(`**Wallet**\n${value}\n\n${embed.description}`)

    const { field: stakingField } = buildEarnField(
      "Staking",
      balances.staking,
      showFullEarn
    )

    if (stakingField) {
      embed.addFields(stakingField)
    }

    const { field: lendingField } = buildEarnField(
      "Flexible",
      balances.lending,
      showFullEarn
    )

    if (lendingField) {
      embed.addFields(lendingField)
    }

    const { field: simpleField } = buildEarnField("Simple", balances.simple)

    if (simpleField) {
      embed.addFields(simpleField)
    }
  }

  // remove value target of self tx
  for (let i = 0; i < txns.length; i++) {
    if (txns[i].target === profileId) {
      txns[i].target = ""
    }
  }
  embed.addFields([
    {
      name: `Total (U.S dollar)`,
      value: `${getEmoji("CASH")} \`$${formatDigit({
        value: totalWorth.toString(),
        fractionDigits: totalWorth > 100 ? 0 : 2,
      })}\`${
        balanceType === BalanceType.Onchain && balances.pnl !== 0
          ? ` (${getEmoji(
              Math.sign(balances.pnl) === -1
                ? "ANIMATED_ARROW_DOWN"
                : "ANIMATED_ARROW_UP",
              true
            )}${formatDigit({
              value: Math.abs(balances.pnl),
              fractionDigits: 2,
            })}%)`
          : ""
      }`,
    },
    ...(!txns.length
      ? []
      : await buildRecentTxFields({ recent_transaction: txns })),
  ])

  if (emptyText) {
    embed.setDescription(`${emptyText}${embed.description}`)
  } else if (isOwnWallet) {
    embed.setDescription(`${props.description}\n\n${embed.description}`)
  }

  return { embed, trackingType, isOwnWallet, totalPage }
}

function buildFarmingField(farming: any[], showFull = false) {
  let total = 0
  if (!farming || !farming.length)
    return {
      total,
      field: null,
    }

  const info = farming
    ?.filter(
      (i) =>
        i.liquidityTokenBalance !== "0" ||
        !BigNumber.from(i.liquidityTokenBalance.split(".").at(0)).isZero()
    )
    .map((i) => {
      const liquidityBal = BigNumber.from(
        i.liquidityTokenBalance.split(".").at(0)
      )
      const [symbol0, symbol1] = [i.pair.token0.symbol, i.pair.token1.symbol]
      const amount = `${formatDigit({
        value: i.liquidityTokenBalance,
        fractionDigits: liquidityBal.gte(1000) ? 0 : 2,
      })} ${symbol0}-${symbol1}`
      const balanceWorth =
        i.pair.token0.balance * +i.pair.token0.tokenDayData[0].priceUSD +
        i.pair.token1.balance * +i.pair.token1.tokenDayData[0].priceUSD

      const rewardWorth =
        i.reward.amount * +i.reward.token.tokenDayData[0].priceUSD

      const usdWorth = `$${formatDigit({
        value: balanceWorth,
        fractionDigits: balanceWorth > 100 ? 0 : 2,
      })}`

      const reward = `${formatDigit({
        value: i.reward.amount.toString(),
        fractionDigits: 2,
      })} ${i.reward.token.symbol}`

      const rewardUsdWorth = `$${formatDigit({
        value: rewardWorth,
        fractionDigits: rewardWorth > 100 ? 0 : 2,
      })}`

      total += balanceWorth + rewardWorth
      const record = []

      if (showFull) {
        record.push(
          {
            emoji: `${getEmoji(symbol0)}${getEmoji(symbol1)}`,
            amount,
            usdWorth,
            reward: "",
          },
          {
            emoji: `${getEmoji("BLANK")}${getEmoji("GIFT")}`,
            amount: reward,
            usdWorth: rewardUsdWorth,
            reward: "",
          }
        )
      } else {
        record.push({
          emoji: `${getEmoji(symbol0)}${getEmoji(symbol1)}`,
          amount,
          usdWorth,
          reward: rewardUsdWorth,
        })
      }

      return record
    })
    .flat()

  if (!info)
    return {
      total,
      field: null,
    }

  const value = formatDataTable(info, {
    cols: showFull ? ["amount", "usdWorth"] : ["amount", "usdWorth", "reward"],
    rowAfterFormatter: (f, i) =>
      `${info[i].emoji}${f}${showFull ? "" : getEmoji("GIFT")}`,
    separator: [` ${APPROX} `, VERTICAL_BAR],
    ...(showFull
      ? {
          dividerEvery: 2,
        }
      : {}),
  }).joined

  if (!value)
    return {
      total,
      field: null,
    }

  return {
    total,
    field: {
      name: "Farming",
      value,
      inline: false,
    },
  }
}

function buildEarnField(title: string, earning: any[], showFull = false) {
  let total = 0
  if (!earning || !earning.length)
    return {
      total,
      field: null,
    }

  const info = earning
    .filter((i) => i.amount > 0 && i.price > 0)
    .map((i) => {
      // TODO: `amount` could be a very large amount, can't treat it like regular js numbers
      const earningWorth = i.amount * i.price
      const rewardWorth = i.reward * i.price
      const amount = `${formatDigit({
        value: i.amount,
        fractionDigits: i.amount > 1000 ? 0 : 2,
      })} ${i.symbol}`

      total += earningWorth + rewardWorth
      const record = []

      const usdWorth = `$${formatDigit({
        value: earningWorth.toString(),
        fractionDigits: earningWorth > 100 ? 0 : 2,
      })}`

      const reward = `${formatDigit({
        value: i.reward.toString(),
        fractionDigits: 2,
      })} ${i.symbol}`

      const rewardUsdWorth = rewardWorth
        ? `$${formatDigit({
            value: rewardWorth.toString(),
            fractionDigits: rewardWorth > 100 ? 0 : 2,
          })}`
        : ""

      if (showFull) {
        record.push(
          {
            emoji: getEmoji(i.symbol),
            amount,
            usdWorth,
            reward,
          },
          {
            emoji: getEmoji("GIFT"),
            amount: reward,
            usdWorth: rewardUsdWorth,
            reward: "",
          }
        )
      } else {
        record.push({
          emoji: getEmoji(i.symbol),
          amount,
          usdWorth,
          reward: rewardUsdWorth,
        })
      }

      return record
    })
    .flat()

  if (!info)
    return {
      total,
      field: null,
    }

  const value = formatDataTable(info, {
    cols: showFull ? ["amount", "usdWorth"] : ["amount", "usdWorth", "reward"],
    rowAfterFormatter: (f, i) =>
      `${info[i].emoji}${f}${
        showFull || !info[i].reward ? "" : getEmoji("GIFT")
      }`,
    separator: [` ${APPROX} `, VERTICAL_BAR],
    ...(showFull ? { dividerEvery: 2 } : {}),
  }).joined

  if (!value)
    return {
      field: null,
      total,
    }

  return {
    total,
    field: {
      name: `\n${title}`,
      value,
      inline: false,
    },
  }
}

export async function renderBalances(
  discordId: string,
  {
    interaction,
    type,
    address,
    view = BalanceView.Compact,
    showFullEarn = false,
    page = 0,
    balances: ctxBalances,
    txns: ctxTxns,
  }: {
    interaction: Interaction
    type: BalanceType
    address: string
    view?: BalanceView
    showFullEarn?: boolean
    balances?: any
    txns?: any
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
  const [balances, txns] = await Promise.all([
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
    ctxTxns && page !== 0
      ? ctxTxns
      : getTxns(
          profileId,
          discordId,
          type,
          interaction,
          resolvedAddress,
          addressType
        ),
  ])
  const isViewingOther = interaction.user.id !== discordId

  const { embed, trackingType, isOwnWallet, totalPage } = await switchView(
    view,
    props,
    balances,
    txns,
    discordId,
    type,
    showFullEarn,
    isViewingOther,
    page,
    profileId
  )
  return {
    context: {
      address,
      type,
      chain: addressType,
      showFullEarn,
      page,
      balances,
      txns,
    },
    msgOpts: {
      embeds: [embed],
      components: [
        ...(!isOwnWallet && type === BalanceType.Onchain
          ? [getGuestWalletButtons(trackingType)]
          : [
              new MessageActionRow().addComponents(
                new MessageButton()
                  .setStyle("SECONDARY")
                  .setEmoji("<a:brrr:902558248907980871>")
                  .setCustomId(`view_earn`)
                  .setLabel("Earn"),
                ...getButtons()
              ),
            ]),
        ...(type === BalanceType.Onchain
          ? [
              new MessageActionRow().addComponents(
                new MessageButton()
                  .setStyle("PRIMARY")
                  .setEmoji(getEmoji("WALLET_2"))
                  .setCustomId(`view_portfolio`)
                  .setLabel("Portfolio")
                  .setDisabled(true),
                new MessageButton()
                  .setStyle("PRIMARY")
                  .setEmoji(getEmoji("NFT2"))
                  .setCustomId(`view_nft`)
                  .setLabel("NFT")
              ),
            ]
          : []),
        ...paginationButtons(page, totalPage),
      ],
    },
  }
}

export function unLinkOnChainWalletButtons() {
  const buttons = new MessageActionRow()
  buttons.addComponents(
    new MessageButton()
      .setLabel("Unlink")
      .setStyle("SECONDARY")
      .setCustomId("unlink_wallet")
  )

  return buttons
}

function getGuestWalletButtons(trackingType: string) {
  const buttons = new MessageActionRow()

  if (trackingType === TRACKING_TYPE_FOLLOW) {
    buttons.addComponents(
      new MessageButton()
        .setLabel("Unfollow")
        .setStyle("SECONDARY")
        .setCustomId("untrack_wallet")
        .setEmoji(getEmoji("REVOKE"))
    )
  } else {
    buttons.addComponents(
      new MessageButton()
        .setLabel("Follow")
        .setStyle("SECONDARY")
        .setCustomId("follow_wallet")
        .setEmoji(getEmoji("PLUS"))
    )
  }

  if (trackingType === TRACKING_TYPE_TRACK) {
    buttons.addComponents(
      new MessageButton()
        .setLabel("Untrack")
        .setStyle("SECONDARY")
        .setCustomId("untrack_wallet")
        .setEmoji(getEmoji("REVOKE"))
    )
  } else {
    buttons.addComponents(
      new MessageButton()
        .setLabel("Track")
        .setStyle("SECONDARY")
        .setCustomId("track_wallet")
        .setEmoji(getEmoji("ANIMATED_STAR", true))
    )
  }

  if (trackingType === TRACKING_TYPE_COPY) {
    buttons.addComponents(
      new MessageButton()
        .setLabel("Uncopy")
        .setStyle("SECONDARY")
        .setCustomId("untrack_wallet")
        .setEmoji(getEmoji("REVOKE"))
    )
  } else {
    buttons.addComponents(
      new MessageButton()
        .setLabel("Copy")
        .setStyle("SECONDARY")
        .setCustomId("copy_wallet")
        .setEmoji(getEmoji("SWAP_ROUTE"))
    )
  }

  return buttons
}

export function getButtons() {
  return [
    new MessageButton()
      .setStyle("SECONDARY")
      .setEmoji(getEmoji("SHARE"))
      .setCustomId(`send`)
      .setLabel("Send"),
    new MessageButton()
      .setStyle("SECONDARY")
      .setEmoji(getEmoji("ANIMATED_TOKEN_ADD", true))
      .setCustomId(`deposit`)
      .setLabel("Deposit"),
    new MessageButton()
      .setStyle("SECONDARY")
      .setCustomId(`view_invest`)
      .setEmoji(getEmoji("BANK"))
      .setLabel("Invest"),
  ]
}

export async function getBalanceTokens(i: ButtonInteraction) {
  const discordId = i.user.id
  const profileId = await getProfileIdByDiscord(discordId)

  const { addressType } =
    (await balanceEmbedProps[BalanceType.Offchain]?.(
      discordId,
      profileId,
      "",
      i
    )) ?? {}
  const balances = await getBalances(
    profileId,
    discordId,
    BalanceType.Offchain,
    i,
    "",
    addressType
  )

  const availableTokens = balances.data.map(
    ({
      token: { symbol },
    }: {
      token: {
        symbol: string
      }
    }) => symbol
  )

  return availableTokens
}

export async function unlinkWallet(
  msg: OriginalMessage,
  author: User,
  addressOrAlias: string
) {
  const profileId = await getProfileIdByDiscord(author.id)
  const { ok, status, log, curl } = await profile.disconnectOnChainWallet(
    profileId,
    addressOrAlias
  )
  // wallet not found
  if (!ok && status === 404) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: " Invalid wallet information",
      descriptions: ["We couldn't process that request"],
      reason: "Address or alias is incorrect",
    })
  }
  if (!ok) throw new APIError({ msgOrInteraction: msg, description: log, curl })
  // remove successfully
  const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
  const embed = getSuccessEmbed({
    title: `${shortenHashOrAddress(addressOrAlias, 9, 10)} unlinked`,
    description: [
      `${pointingright} This wallet has been removed from your profile.`,
      `${pointingright} To add wallets, refer to ${await getSlashCommand(
        "wallet add"
      )}.`,
    ].join("\n"),
  })
  return { msgOpts: { embeds: [embed], components: [] } }
}

export async function renderInitialNftView({
  discordId,
  interaction,
  type,
  address,
}: {
  discordId: string
  interaction: Interaction
  type: BalanceType
  address: string
}) {
  // handle name service
  const resolvedAddress = (await resolveNamingServiceDomain(address)) || address
  const profileId = await getProfileIdByDiscord(discordId)
  const { chainType } = isAddress(address)
  const addressType = chainType || AddressChainType.EVM
  const data = await getBalances(
    profileId,
    discordId,
    type,
    interaction,
    resolvedAddress,
    addressType
  )

  const nfts: any[] = (data.nfts || [])
    .filter((nft: any) => nft.total > 0)
    .slice(0, 8)

  const description = nfts.length
    ? `${nfts
        .map(
          (nft, idx) =>
            `${getEmoji(`NUM_${idx + 1}` as EmojiKey)} ${nft.collection_name}`
        )
        .join("\n")}`
    : "No NFT data found"

  const embed = composeEmbedMessage(null, {
    author: [
      `${shortenHashOrAddress(address)}'s NFT`,
      getEmojiURL(emojis.NFT2),
    ],
    description,
  })

  return {
    context: {
      nfts,
      profileId,
      address,
      type,
      chain: addressType,
    },
    msgOpts: {
      embeds: [embed],
      components: [
        ...(nfts.length > 0
          ? [
              new MessageActionRow().addComponents(
                new MessageSelectMenu().setCustomId("select_nft").addOptions(
                  nfts.map((nft, idx) => {
                    return {
                      emoji: getEmoji(`NUM_${idx + 1}` as EmojiKey),
                      label: nft.collection_name,
                      value: nft.collection_name,
                    }
                  })
                )
              ),
            ]
          : []),
        new MessageActionRow().addComponents(
          new MessageButton()
            .setStyle("SECONDARY")
            .setEmoji("<a:brrr:902558248907980871>")
            .setCustomId(`view_earn`)
            .setLabel("Earn"),
          ...getButtons()
        ),
        new MessageActionRow().addComponents(
          new MessageButton()
            .setStyle("PRIMARY")
            .setEmoji(getEmoji("WALLET_2"))
            .setCustomId(`view_portfolio`)
            .setLabel("Portfolio"),
          new MessageButton()
            .setStyle("PRIMARY")
            .setEmoji(getEmoji("NFT2"))
            .setCustomId(`view_nft`)
            .setLabel("NFT")
            .setDisabled(true)
        ),
      ],
    },
  }
}

export function renderSelectedNft({
  nfts,
  type,
  address,
  collection = "",
}: {
  nfts: any[]
  type: BalanceType
  address: string
  collection?: string
}) {
  const selectedNft = collection
    ? nfts.find((nft) => equalIgnoreCase(nft.collection_name, collection))
    : nfts?.[0]

  const description = `${selectedNft?.tokens
    .slice(0, 8)
    .map(
      (t: any, idx: number) =>
        `${getEmoji(`NUM_${idx + 1}` as EmojiKey)} [${t.token_name}](${
          t.marketplace_url
        })`
    )
    .join("\n")}${
    selectedNft.total > 8
      ? `\n... and ${selectedNft.total - 8} more other tokens`
      : ""
  }`

  const embed = composeEmbedMessage(null, {
    author: [
      `${shortenHashOrAddress(address)}'s ${selectedNft.collection_name}`,
      getEmojiURL(emojis.NFT2),
    ],
    description,
  })

  return {
    context: {
      address,
      type,
      nfts,
      collection,
    },
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu().setCustomId("select_nft").addOptions(
            nfts.map((nft, idx) => {
              return {
                emoji: getEmoji(`NUM_${idx + 1}` as EmojiKey),
                label: nft.collection_name,
                value: nft.collection_name,
                default: equalIgnoreCase(nft.collection_name, collection),
              }
            })
          )
        ),
        new MessageActionRow().addComponents(
          new MessageButton()
            .setStyle("SECONDARY")
            .setEmoji("<a:brrr:902558248907980871>")
            .setCustomId(`view_earn`)
            .setLabel("Earn"),
          ...getButtons()
        ),
        new MessageActionRow().addComponents(
          new MessageButton()
            .setStyle("PRIMARY")
            .setEmoji(getEmoji("WALLET_2"))
            .setCustomId(`view_portfolio`)
            .setLabel("Portfolio"),
          new MessageButton()
            .setStyle("PRIMARY")
            .setEmoji(getEmoji("NFT2"))
            .setCustomId(`view_nft`)
            .setLabel("NFT")
            .setDisabled(true)
        ),
      ],
    },
  }
}
