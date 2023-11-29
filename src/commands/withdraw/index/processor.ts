import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageEmbed,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { APIError } from "errors"
import { KafkaQueueActivityDataCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { defaultActivityMsg, sendActivityMsg } from "utils/activity"
import {
  TokenEmojiKey,
  emojis,
  equalIgnoreCase,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  isAddress,
  isValidAmount,
  thumbnails,
  shortenHashOrAddress,
  msgColors,
} from "utils/common"
import {
  MOCHI_ACTION_WITHDRAW,
  MOCHI_APP_SERVICE,
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
} from "utils/constants"
import { enableDMMessage } from "ui/discord/embed"
import mochiPay from "../../../adapters/mochi-pay"
import { convertString } from "../../../utils/convert"
import {
  formatDigit,
  formatTokenDigit,
  formatUsdDigit,
  isValidTipAmount,
} from "../../../utils/defi"
import { getProfileIdByDiscord } from "../../../utils/profile"
import { getBalances, isTokenSupported } from "../../../utils/tip-bot"
import { formatView } from "commands/balances/index/processor"
import CacheManager from "cache/node-cache"
import { BigNumber, utils } from "ethers"
import { getSlashCommand } from "utils/commands"
import { formatEther, parseEther, parseUnits } from "ethers/lib/utils"

type Params = {
  amount?: string
  token?: TokenEmojiKey
  address?: string
  tokenObj?: any
}

CacheManager.init({
  pool: "withdraw-request-payload",
  ttl: 0,
  checkperiod: 0,
})

export function checkCommitableOperation(
  tokenAmount: string,
  amount: string,
  token: any,
) {
  const tokenDecimal = token.decimal ?? 0

  const parsedAmount = Number(amount)
  if (!isValidAmount({ arg: amount, exceptions: ["all"] })) {
    return { valid: false, error: "The amount is invalid" }
  } else if (
    parsedAmount > convertString(tokenAmount, tokenDecimal) &&
    tokenDecimal > 0
  ) {
    return { valid: false, error: "Insufficient balance" }
  } else if (parsedAmount > 0 && !isValidTipAmount(amount, tokenDecimal)) {
    return {
      valid: false,
      error: `${token.symbol} valid amount must not have more than ${tokenDecimal} fractional digits.`,
    }
  }

  return {
    valid: true,
    error: null,
  }
}

function renderPreview(params: {
  address?: string
  network?: string
  token?: string
  amount?: string
  fee?: string
}) {
  return {
    name: "\u200b\nPreview",
    value: [
      params.address &&
        `${getEmoji("WALLET_1")}\`Address.  ${shortenHashOrAddress(
          params.address,
          5,
          5,
        )}\``,
      params.network &&
        `${getEmoji("SWAP_ROUTE")}\`Network.  \`${params.network}`,
      `${getEmoji("SWAP_ROUTE")}\`Source.   \`Mochi wallet`,
      params.token &&
        `${getEmoji("ANIMATED_COIN_1", true)}\`Coin.     \`${params.token}`,
      params.token &&
        params.amount &&
        `${getEmoji("NFT2")}\`Amount.   \`${getEmojiToken(
          params.token as TokenEmojiKey,
        )} **${params.amount} ${params.token}**`,
      params.fee &&
        params.token &&
        `${getEmoji("CASH")}\`Fee.      \`${formatTokenDigit(params.fee)} ${
          params.token
        }`,
    ]
      .filter(Boolean)
      .join("\n"),
    inline: false,
  }
}

async function savePayload(
  i: CommandInteraction | MessageComponentInteraction,
  {
    address,
    amount: _amount,
    token,
    tokenId,
    chainId,
    decimal,
  }: {
    address?: string
    amount: string
    token: string
    tokenId: string
    chainId: string
    decimal: number
  },
) {
  const profileId = await getProfileIdByDiscord(i.user.id)
  const amount = _amount.replaceAll(",", "")
  const payload = {
    address,
    profileId,
    amount,
    token,
    tokenId,
    decimal,
    chainId,
    platform: "discord",
    platform_user_id: i.user.id,
    amount_string: formatDigit({
      value: amount.toString(),
      fractionDigits: decimal,
    }),
  }

  await CacheManager.set({
    pool: "withdraw-request-payload",
    key: i.user.id,
    val: payload as any,
  })
}

// enter address
export async function withdrawStep3(
  interaction: CommandInteraction | MessageComponentInteraction,
  params: Params = {},
) {
  const balances = await getBalances({ msgOrInteraction: interaction })

  const filteredBals = balances.filter(
    (b: any) => !params.token || equalIgnoreCase(b.token.symbol, params.token),
  )

  // straight from command
  if (interaction.isCommand() && filteredBals.length > 1) {
    const { msgOpts } = await withdrawStep1(interaction, params.token)

    return {
      overrideInitialState: "withdrawStep1",
      context: { amount: "%0" },
      msgOpts,
    }
  }

  let tokenObj = params.tokenObj
  tokenObj ??= filteredBals.at(0)

  if (!tokenObj) {
    return {
      overrideInitialState: "withdrawStep1",
      context: { amount: "%0" },
      msgOpts: (
        await withdrawStep1(interaction as CommandInteraction, params.token)
      ).msgOpts,
    }
  }

  const { valid, error } = checkCommitableOperation(
    tokenObj.amount,
    params.amount ?? "0",
    tokenObj.token,
  )
  if (error) {
    const { msgOpts } = await withdrawStep2(interaction, {
      tokenObj,
      amount: params.amount,
      token: tokenObj.token.symbol,
    })

    return {
      overrideInitialState: "withdrawStep2",
      context: {
        tokenObj,
        amount: params.amount,
        token: tokenObj.token.symbol,
      },
      msgOpts,
    }
  }

  const profileId = await getProfileIdByDiscord(interaction.user.id)
  let recentTxns = []
  const { data, ok } = await mochiPay.getWithdrawTxnsV2({
    profileId,
    tokenId: tokenObj.token.id,
  })

  if (ok) {
    recentTxns = data as any[]
  }

  const listWalletsRecentlyUsed = Array.from(
    new Set(recentTxns.map((tx) => tx.other_profile_source)),
  )

  const { valid: validAddress } = isAddress(params.address ?? "")

  if (valid && validAddress) {
    await savePayload(interaction, {
      address: params.address,
      chainId: tokenObj.token.chain.chain_id,
      decimal: tokenObj.token.decimal,
      token: params.token ?? "",
      tokenId: tokenObj.token.id,
      amount: params.amount ?? "0",
    })
  }

  const embed = composeEmbedMessage(null, {
    author: ["Choose your address", getEmojiURL(emojis.ANIMATED_WITHDRAW)],
    description: `${getEmoji("ANIMATED_POINTING_DOWN", true)} Enter address${
      listWalletsRecentlyUsed.length ? " or choose from list below" : ""
    }.`,
  }).addFields(
    renderPreview({
      address: params.address,
      token: tokenObj.token.symbol,
      amount: params.amount,
      network: tokenObj.token.chain.name,
    }),
  )

  return {
    context: {
      ...params,
      tokenObj,
    },
    msgOpts: {
      embeds: [embed],
      components: [
        ...(listWalletsRecentlyUsed.length
          ? [
              new MessageActionRow().addComponents(
                new MessageSelectMenu()
                  .setPlaceholder("💰 Recently used wallets")
                  .setCustomId("select_address")
                  .addOptions(
                    listWalletsRecentlyUsed.slice(0, 25).map((a) => ({
                      label: `🔹 ${shortenHashOrAddress(a, 5, 5)}`,
                      value: a,
                    })),
                  ),
              ),
            ]
          : []),
        new MessageActionRow().addComponents(
          ...(validAddress && valid
            ? [
                new MessageButton()
                  .setLabel("Confirm 3/3")
                  .setCustomId("submit")
                  .setStyle("PRIMARY"),
              ]
            : []),
          new MessageButton({
            label: `${params.address ? "Change" : "Enter"} address`,
            style: "SECONDARY",
            customId: "enter_address",
          }),
        ),
      ],
    },
  }
}

// select withdraw amount
export async function withdrawStep2(
  interaction: CommandInteraction | MessageComponentInteraction,
  params: Params,
) {
  const balances = await getBalances({ msgOrInteraction: interaction })

  const tokenObj =
    params.tokenObj ||
    balances.find((b: any) => equalIgnoreCase(b.id, params.token))

  let error: string | null = ""

  const tokenAmount = tokenObj.amount
  const tokenDecimal = tokenObj.token.decimal ?? 0

  const getPercentage = (percent: number) =>
    BigNumber.from(tokenAmount).mul(percent).div(100).toString()
  let amount

  const isAll =
    params.amount === "%100" || equalIgnoreCase(params.amount ?? "", "all")
  if (params.amount?.startsWith("%") || isAll) {
    const formatted = utils.formatUnits(
      getPercentage(
        params.amount?.toLowerCase() === "all"
          ? 100
          : Number(params.amount?.slice(1)),
      ),
      tokenDecimal,
    )
    amount = formatDigit({
      value: formatted,
      fractionDigits: isAll ? 2 : Number(formatted) >= 1000 ? 0 : 2,
    })
  } else {
    let valid
    ;({ valid, error } = checkCommitableOperation(
      tokenObj.amount,
      params.amount ?? "0",
      tokenObj.token,
    ))

    if (valid) {
      amount = formatUsdDigit(params.amount ?? "0")
    }
  }

  const { text } = formatView("compact", "filter-dust", [tokenObj], 0)
  const isNotEmpty = !!text
  const emptyText = `${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true,
  )} You have nothing yet, use ${await getSlashCommand(
    "earn",
  )} or ${await getSlashCommand("deposit")} `

  const embed = composeEmbedMessage(null, {
    author: [
      `How many ${tokenObj.token.symbol} to withdraw ? `,
      getEmojiURL(emojis.NFT2),
    ],
    description: isNotEmpty ? text : emptyText,
  }).addFields(
    renderPreview({
      network: tokenObj.token.chain.name,
      token: tokenObj.token.symbol,
      amount: String(error ? 0 : amount),
    }),
  )

  return {
    context: {
      ...params,
      token: tokenObj.token.symbol,
      tokenObj,
      amount,
    },
    msgOpts: {
      embeds: [
        embed,
        ...(error
          ? [
              new MessageEmbed({
                description: `${getEmoji("NO")} **${error}**`,
                color: msgColors.ERROR,
              }),
            ]
          : []),
      ],
      components: [
        new MessageActionRow().addComponents(
          ...[10, 25, 50].map((p) =>
            new MessageButton()
              .setLabel(`${p}%`)
              .setStyle("SECONDARY")
              .setCustomId(`select_amount_${p}`),
          ),
          new MessageButton()
            .setLabel("All")
            .setStyle("SECONDARY")
            .setCustomId(`select_amount_100`),
          new MessageButton()
            .setLabel("Custom")
            .setStyle("SECONDARY")
            .setCustomId("enter_amount"),
        ),
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel("Continue (2/3)")
            .setCustomId("continue")
            .setStyle("PRIMARY")
            .setDisabled(!!error || Number(amount) <= 0),
        ),
      ],
    },
  }
}

// select token
export async function withdrawStep1(
  interaction: CommandInteraction | SelectMenuInteraction,
  filterSymbol?: string,
) {
  const balances = await getBalances({ msgOrInteraction: interaction })

  const filteredBals = balances.filter(
    (b: any) => !filterSymbol || equalIgnoreCase(b.token.symbol, filterSymbol),
  )

  if (interaction.isSelectMenu() || filteredBals.length === 1) {
    let tokenObj
    if (interaction.isSelectMenu()) {
      const tokenId = interaction.values[0]
      tokenObj = balances.find((b: any) => b.id === tokenId)
    } else {
      tokenObj = filteredBals.at(0)
    }

    await isTokenSupported(tokenObj.token.symbol)

    const { msgOpts } = await withdrawStep2(interaction, {
      token: tokenObj.token.symbol,
      tokenObj,
      amount: "%0",
    })

    return {
      overrideInitialState: "withdrawStep2",
      context: {
        token: tokenObj.token.symbol,
        tokenObj,
        amount: "%0",
      },
      msgOpts,
    }
  }

  if (!balances.length) {
    return {
      msgOpts: {
        embeds: [
          new MessageEmbed({
            description: `${getEmoji(
              "NO",
            )} You have no balance. Try ${await getSlashCommand(
              "deposit",
            )} first`,
            color: msgColors.ERROR,
          }),
        ],
      },
    }
  }

  // TODO: remove hardcode 1
  const { text } = formatView(
    "compact",
    "filter-dust",
    filteredBals.length ? filteredBals : balances,
    0,
  )

  const embed = composeEmbedMessage(null, {
    author: ["Choose your money source", getEmojiURL(emojis.NFT2)],
    description: text,
  }).addFields(
    renderPreview({
      ...(filterSymbol && filteredBals.length ? { token: filterSymbol } : {}),
    }),
  )

  const isDuplicateSymbol = (s: string) =>
    balances.filter((b: any) => b.token.symbol.toUpperCase() === s).length > 1

  return {
    context: {
      amount: "%0",
    },
    msgOpts: {
      embeds: [
        embed,
        ...(!filteredBals.length && filterSymbol
          ? [
              new MessageEmbed({
                description: `${getEmoji("NO")} No token ${getEmojiToken(
                  filterSymbol as TokenEmojiKey,
                )} **${filterSymbol}** found in your balance.`,
                color: msgColors.ERROR,
              }),
            ]
          : []),
      ],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setPlaceholder("💵 Choose money source (1/3)")
            .setCustomId("select_token")
            .setOptions(
              balances.slice(0, 25).map((b: any) => ({
                label: `${b.token.symbol}${
                  isDuplicateSymbol(b.token.symbol)
                    ? ` (${b.token.chain.symbol})`
                    : ""
                }`,
                value: b.id,
                emoji: getEmojiToken(b.token.symbol),
              })),
            ),
        ),
      ],
    },
  }
}

function composeWithdrawEmbed() {
  return composeEmbedMessage(null, {
    author: ["Withdraw Submitted", thumbnails.MOCHI],
    image: thumbnails.MOCHI_POSE_11,
    description: [
      `${getEmoji("CHECK")} Your withdraw is underway.`,
      `${getEmoji("CHECK")} Mochi will DM you with the tx link shortly.`,
    ].join("\n"),
  })
}

export async function executeWithdraw(
  interaction: ButtonInteraction,
  params: Params,
) {
  const payload = await CacheManager.get({
    pool: "withdraw-request-payload",
    key: interaction.user.id,
    call: () => Promise.resolve(null),
  })

  if (payload.amount === "all") {
    const balances = await getBalances({ msgOrInteraction: interaction })
    const balObj = balances.find((b: any) => b.token.id === payload.tokenId)
    payload.amount = formatEther(balObj.amount)
  }

  // withdraw
  const amount = parseUnits(
    payload.amount.toLocaleString().replaceAll(",", ""),
    payload.decimal,
  ).toString()
  const { ok, error, log, curl } = await mochiPay.withdrawV2({
    ...payload,
    amount,
  })
  if (!ok) {
    throw new APIError({
      msgOrInteraction: interaction,
      curl,
      description: log,
      error,
    })
  }

  const kafkaMsg: KafkaQueueActivityDataCommand = defaultActivityMsg(
    payload.profileId,
    MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
    MOCHI_APP_SERVICE,
    MOCHI_ACTION_WITHDRAW,
  )
  kafkaMsg.activity.content.amount = payload.amount
  kafkaMsg.activity.content.token = payload.token
  sendActivityMsg(kafkaMsg)

  const embed = composeWithdrawEmbed()
  const msg = await interaction.user
    .send({
      embeds: [embed],
    })
    .catch(() => null)

  if (!msg)
    return {
      msgOpts: {
        embeds: [
          enableDMMessage(
            "Your request has been submitted and result will be sent to your DM, but ",
          ),
        ],
      },
    }

  return {
    msgOpts: {
      embeds: [
        composeEmbedMessage(null, {
          author: [
            "Withdrawal submitted",
            getEmojiURL(emojis.ANIMATED_WITHDRAW),
          ],
          description: renderPreview({
            address: params.address,
            network: params.tokenObj.token.chain.name,
            token: params.token,
            amount: params.amount,
          }).value,
        }),
      ],
      components: [],
    },
  }
}
