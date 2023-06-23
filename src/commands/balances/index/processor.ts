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
  SelectMenuInteraction,
} from "discord.js"
import { APIError, InternalError } from "errors"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import {
  emojis,
  equalIgnoreCase,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  isAddress,
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

export enum BalanceType {
  Offchain = 1,
  Onchain,
  Cex,
}

export enum BalanceView {
  Compact = 1,
  Expand,
}

type Interaction =
  | CommandInteraction
  | SelectMenuInteraction
  | ButtonInteraction

const balanceEmbedProps: Record<
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
    if (equalIgnoreCase(addressType, "eth")) {
      addressType = "evm"
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
}

export async function getBalances(
  profileId: string,
  discordId: string,
  type: BalanceType,
  msg: Interaction,
  address: string,
  addressType: string
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
    farming,
    staking,
    pnl = 0
  if (type === BalanceType.Offchain) {
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
  }
  if (type === BalanceType.Cex) {
    data = res.data.filter((i: any) => Boolean(i))
    pnl = 0
  }

  return {
    data,
    pnl,
    farming,
    staking,
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
}

async function getTxns(
  profileId: string,
  discordId: string,
  type: BalanceType,
  msg: Interaction,
  address: string,
  addressType: string
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
    return (res.data ?? [])
      .filter(
        (d: any) =>
          d.has_transfer &&
          d.successful &&
          d.actions?.some(
            (a: any) => a.native_transfer || a.name === "Transfer"
          )
      )
      .map((d: any) => {
        const date = d.signed_at
        const firstAction = d.actions?.find(
          (a: any) => a.native_transfer || a.name === "Transfer"
        )
        if (!firstAction) return ""
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
  }[]
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
          fractionDigits: tokenVal >= 100000 ? 0 : 2,
        })
        const usdWorth = formatDigit({
          value: usdVal.toString(),
          fractionDigits: 2,
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
    const { joined: text } = formatDataTable(
      formattedBal.map((b) => ({
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
    return { totalWorth, text }
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
          fractionDigits: tokenVal >= 100000 ? 0 : 2,
        })
        const usdWorth = formatDigit({
          value: usdVal.toString(),
          fractionDigits: 2,
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
    return { totalWorth, fields }
  }
}

async function switchView(
  view: BalanceView,
  props: { address: string; emoji: string; title: string; description: string },
  balances: { data: any[]; farming: any[]; staking: any[]; pnl: number },
  txns: any,
  discordId: string,
  balanceType: number,
  showFullEarn: boolean,
  isViewingOther: boolean
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

  let totalWorth = 0
  if (view === BalanceView.Compact) {
    const { totalWorth: _totalWorth, text: _text } = formatView(
      "compact",
      "filter-dust",
      balances.data
    )
    const text = _text
      ? `**Spot**\n${_text}`
      : `${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} You have nothing yet, use ${await getSlashCommand(
          "earn"
        )} or ${await getSlashCommand("deposit")}`
    totalWorth = _totalWorth

    if (isOwnWallet) {
      embed.setDescription(`${_text ? `${props.description}\n\n` : ""}${text}`)
    } else {
      embed.setDescription(text)
    }
  } else {
    const { totalWorth: _totalWorth, fields = [] } = formatView(
      "expand",
      "filter-dust",
      balances.data
    )
    totalWorth = _totalWorth
    if (isOwnWallet) {
      embed.setDescription(props.description)
    }

    embed.addFields(fields)
  }

  let grandTotal = totalWorth

  const preventEmptyVal = "\u200b"
  if (balanceType === BalanceType.Offchain) {
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
          cexes: {
            data: [],
          },
        })) + preventEmptyVal,
      inline: false,
    })
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
            total: formatDigit({
              value: totalWorth.toString(),
              fractionDigits: 2,
            }),
          },
        ],
      },
    })
    embed.spliceFields(1, 0, {
      name: "Wallet",
      value: value + preventEmptyVal,
      inline: false,
    })

    // farming
    const { field: farmingField, total: totalFarm } = buildFarmingField(
      balances.farming,
      showFullEarn
    )
    // staking
    const { field: stakingField, total: totalStake } = buildStakingField(
      balances.staking,
      showFullEarn
    )

    if (farmingField) {
      grandTotal += totalFarm
      embed.addFields(farmingField)
    }

    if (stakingField) {
      grandTotal += totalStake
      embed.addFields(stakingField)
    }
  }

  if (balanceType === BalanceType.Cex) {
    const value = await renderWallets({
      mochiWallets: {
        data: [],
      },
      cexes: {
        data: [
          {
            chain: "Binance",
            total: formatDigit({
              value: totalWorth.toString(),
              fractionDigits: 2,
            }),
          },
        ],
      },
      wallets: {
        data: [],
      },
    })
    embed.spliceFields(1, 0, {
      name: "Wallet",
      value: value + preventEmptyVal,
      inline: false,
    })
  }

  embed.addFields([
    {
      name: `Total (U.S dollar)`,
      value: `${getEmoji("CASH")} \`$${formatDigit({
        value: grandTotal.toString(),
        fractionDigits: grandTotal > 100 ? 0 : 2,
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
  return { embed, trackingType, isOwnWallet }
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
        !BigNumber.from(i.liquidityTokenBalance.replace(".", "")).isZero()
    )
    .map((i) => {
      const [symbol0, symbol1] = [i.pair.token0.symbol, i.pair.token1.symbol]
      const amount = `${formatDigit({
        value: i.liquidityTokenBalance,
        fractionDigits: 2,
      })} ${symbol0}-${symbol1}`
      const balanceWorth =
        i.pair.token0.balance * +i.pair.token0.tokenDayData[0].priceUSD +
        i.pair.token1.balance * +i.pair.token1.tokenDayData[0].priceUSD

      const rewardWorth =
        i.reward.amount * +i.reward.token.tokenDayData[0].priceUSD

      const usdWorth = `$${formatDigit({
        value: balanceWorth,
        fractionDigits: 0,
      })}`

      const reward = `${formatDigit({
        value: i.reward.amount.toString(),
        fractionDigits: 2,
      })} ${i.reward.token.symbol}`

      const rewardUsdWorth = `$${formatDigit({
        value: rewardWorth,
        fractionDigits: 0,
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
          divider: {
            every: 2,
            pad: `${getEmoji("BLANK")}${getEmoji("BLANK")}`,
          },
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

function buildStakingField(staking: any[], showFull = false) {
  let total = 0
  if (!staking || !staking.length)
    return {
      total,
      field: null,
    }

  const info = staking
    .filter((i) => i.amount > 0)
    .map((i) => {
      const stakingWorth = i.amount * i.price
      const rewardWorth = i.reward * i.price
      const amount = `${formatDigit({
        value: i.amount,
        fractionDigits: 2,
      })} ${i.symbol}`

      total += stakingWorth + rewardWorth
      const record = []

      const usdWorth = `$${formatDigit({
        value: stakingWorth.toString(),
        fractionDigits: 2,
      })}`

      const reward = `${formatDigit({
        value: i.reward.toString(),
        fractionDigits: 2,
      })} ${i.symbol}`

      const rewardUsdWorth = `$${formatDigit({
        value: rewardWorth.toString(),
        fractionDigits: 2,
      })}`

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
      `${info[i].emoji}${f}${showFull ? "" : getEmoji("GIFT")}`,
    separator: [` ${APPROX} `, VERTICAL_BAR],
    ...(showFull ? { divider: { every: 2, pad: getEmoji("BLANK") } } : {}),
  }).joined

  if (!value)
    return {
      field: null,
      total,
    }

  return {
    total,
    field: {
      name: "\nStaking",
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
  }: {
    interaction: Interaction
    type: BalanceType
    address: string
    view?: BalanceView
    showFullEarn?: boolean
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
    getBalances(
      profileId,
      discordId,
      type,
      interaction,
      resolvedAddress,
      addressType ?? "eth"
    ),
    getTxns(
      profileId,
      discordId,
      type,
      interaction,
      resolvedAddress,
      addressType ?? "eth"
    ),
  ])
  const isViewingOther = interaction.user.id !== discordId
  const { embed, trackingType, isOwnWallet } = await switchView(
    view,
    props,
    balances,
    txns,
    discordId,
    type,
    showFullEarn,
    isViewingOther
  )
  return {
    context: {
      address,
      type,
      chain: addressType,
      showFullEarn,
    },
    msgOpts: {
      embeds: [embed],
      components:
        !isOwnWallet && type === BalanceType.Onchain
          ? [
              new MessageActionRow().addComponents(
                new MessageButton()
                  .setStyle("SECONDARY")
                  .setLabel(showFullEarn ? "Collapse" : "Expand")
                  .setCustomId("toggle_show_full_earn")
              ),
              getGuestWalletButtons(trackingType),
            ]
          : [
              new MessageActionRow().addComponents(
                new MessageButton()
                  .setStyle("SECONDARY")
                  .setLabel(showFullEarn ? "Collapse" : "Expand")
                  .setCustomId("toggle_show_full_earn")
              ),
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

export function getGuestWalletButtons(trackingType: string) {
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
