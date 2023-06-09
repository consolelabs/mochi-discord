import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
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
  getAuthor,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  isAddress,
  isValidAmount,
  thumbnails,
  shortenHashOrAddress,
} from "utils/common"
import {
  MOCHI_ACTION_WITHDRAW,
  MOCHI_APP_SERVICE,
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
} from "utils/constants"
import { enableDMMessage } from "ui/discord/embed"
import mochiPay from "../../../adapters/mochi-pay"
import { convertString } from "../../../utils/convert"
import { formatDigit, isValidTipAmount } from "../../../utils/defi"
import { getProfileIdByDiscord } from "../../../utils/profile"
import { isTokenSupported } from "../../../utils/tip-bot"
import { formatView } from "commands/balances/index/processor"
import CacheManager from "cache/node-cache"
import { BigNumber, utils } from "ethers"
import { getSlashCommand } from "utils/commands"

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

async function getBalances(
  i: CommandInteraction | MessageComponentInteraction
) {
  const author = getAuthor(i)
  const profileId = await getProfileIdByDiscord(author.id)

  // validate balance
  const { data, ok } = await mochiPay.getBalances({
    profileId,
  })
  let balances: any[] = []
  if (ok) {
    balances = data.filter((b: any) => b.amount !== "0")
  }

  return balances
}

function checkCommitableOperation(
  balances: any[],
  amount: string,
  symbol: string
) {
  const tokens = balances.filter((b: any) =>
    equalIgnoreCase(b.token.symbol, symbol)
  )

  if (!tokens) return { valid: false, error: "No token found" }
  if (tokens.length > 1)
    return { valid: false, error: "Duplicate symbols found" }

  const [token] = tokens

  const tokenAmount = token.amount ?? 0
  const tokenDecimal = token.token.decimal ?? 0

  const parsedAmount = parseFloat(amount)
  if (!isValidAmount({ arg: amount, exceptions: ["all"] })) {
    return { valid: false, error: "The amount is invalid." }
  } else if (
    parsedAmount > convertString(tokenAmount, tokenDecimal) &&
    tokenDecimal > 0
  ) {
    return { valid: false, error: "Insufficient balance." }
  } else if (parsedAmount > 0 && !isValidTipAmount(amount, tokenDecimal)) {
    return {
      valid: false,
      error: `${token.token.symbol} valid amount must not have more than ${tokenDecimal} fractional digits.`,
    }
  }

  return {
    valid: true,
    error: null,
  }
}

export function confirm(_i: ButtonInteraction, params: Required<Params>) {
  return {
    msgOpts: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Confirm withdrawal", getEmojiURL(emojis.ANIMATED_WITHDRAW)],
          description: [
            `${getEmoji("WALLET_1")}\`Address.  ${shortenHashOrAddress(
              params.address,
              5,
              5
            )}\``,
            `${getEmoji("SWAP_ROUTE")}\`Network.  \`${
              params.tokenObj.token.chain.name
            }`,
            `${getEmoji("SWAP_ROUTE")}\`Source.   \`Mochi wallet`,
            `${getEmoji("ANIMATED_COIN_1", true)}\`Coin.     \`${params.token}`,
            `${getEmoji("NFT2")}\`Amount.   \`${getEmojiToken(
              params.token
            )} **${formatDigit({
              value: params.amount ?? "0",
              fractionDigits: 0,
            })} ${params.token}**`,
            `${getEmoji("CASH")}\`Fee.      \`? ${params.token}`,
          ].join("\n"),
        }),
      ],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton({
            style: "PRIMARY",
            label: "Submit",
            customId: "submit",
          })
        ),
      ],
    },
  }
}

async function savePayload(
  i: CommandInteraction | MessageComponentInteraction,
  {
    address,
    amount: _amount,
    token,
    chainId,
    decimal,
  }: {
    address?: string
    amount: string
    token: string
    chainId: string
    decimal: number
  }
) {
  const profileId = await getProfileIdByDiscord(i.user.id)
  const amount = _amount.replaceAll(",", "")
  const payload = {
    address,
    profileId,
    amount,
    token,
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
  params: Params = {}
) {
  const balances = await getBalances(interaction)

  const filteredBals = balances.filter(
    (b) => !params.token || equalIgnoreCase(b.token.symbol, params.token)
  )

  if (interaction.isCommand() && filteredBals.length > 1) {
    const { msgOpts } = await withdrawStep1(interaction, params.token)

    return {
      overrideInitialState: "withdrawStep1",
      context: { amount: "%0" },
      msgOpts,
    }
  }
  const [tokenObj] = filteredBals

  const { valid, error } = checkCommitableOperation(
    balances,
    params.amount ?? "0",
    tokenObj.token.symbol ?? ""
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
  const { data, ok } = await mochiPay.getWithdrawTxns({
    profileId,
    token: tokenObj.token.symbol,
    chainId: tokenObj.token.chain.chain_id,
  })

  if (ok) {
    recentTxns = data as any[]
  }

  const listWalletsRecentlyUsed = Array.from(
    new Set(recentTxns.map((tx) => tx.address))
  )

  const { valid: validAddress } = isAddress(params.address ?? "")

  if (valid && validAddress) {
    await savePayload(interaction, {
      address: params.address,
      chainId: tokenObj.token.chain.chain_id,
      decimal: tokenObj.token.decimal,
      token: params.token ?? "",
      amount: params.amount ?? "0",
    })
  }

  const embed = composeEmbedMessage(null, {
    author: ["Withdraw", getEmojiURL(emojis.ANIMATED_WITHDRAW)],
  }).addFields(
    {
      name: "Amount",
      value: `${getEmojiToken(params.token as TokenEmojiKey)} ${formatDigit({
        value: params.amount ?? "0",
        fractionDigits: 0,
      })} ${params.token?.toUpperCase()}`,
      inline: false,
    },
    ...(params.address
      ? [
          {
            name: "Destination address",
            value: `\`${shortenHashOrAddress(params.address ?? "", 5, 5)}\``,
          },
        ]
      : [])
  )

  return {
    context: {
      ...params,
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
                    listWalletsRecentlyUsed.map((a) => ({
                      label: `🔹 ${shortenHashOrAddress(a, 5, 5)}`,
                      value: a,
                    }))
                  )
              ),
            ]
          : []),
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel(
              validAddress || !params.address ? "Continue" : "Address not valid"
            )
            .setCustomId("continue")
            .setStyle("PRIMARY")
            .setDisabled(!valid || !validAddress),
          new MessageButton({
            label: `${params.address ? "Change" : "Enter"} address`,
            style: "SECONDARY",
            customId: "enter_address",
          })
        ),
      ],
    },
  }
}

// select withdraw amount
export async function withdrawStep2(
  interaction: CommandInteraction | MessageComponentInteraction,
  params: Params
) {
  const balances = await getBalances(interaction)

  const tokenObj =
    params.tokenObj || balances.find((b) => equalIgnoreCase(b.id, params.token))

  let error: string | null = ""

  const tokenAmount = tokenObj.amount
  const tokenDecimal = tokenObj.token.decimal ?? 0

  const getPercentage = (percent: number) =>
    BigNumber.from(tokenAmount).mul(percent).div(100).toString()
  let amount
  if (
    params.amount?.startsWith("%") ||
    params.amount?.toLowerCase() === "all"
  ) {
    amount = formatDigit({
      value: utils.formatUnits(
        getPercentage(
          params.amount?.toLowerCase() === "all"
            ? 100
            : Number(params.amount.slice(1))
        ),
        tokenDecimal
      ),
      fractionDigits: 0,
    })
  } else {
    let valid
    ;({ valid, error } = checkCommitableOperation(
      balances,
      params.amount ?? "0",
      tokenObj.token.symbol ?? ""
    ))

    if (valid) {
      amount = formatDigit({
        value: params.amount ?? "0",
        fractionDigits: 0,
      })
    }
  }

  const { text } = formatView("compact", "filter-dust", [tokenObj])
  const isNotEmpty = !!text
  const emptyText = `${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true
  )} You have nothing yet, use ${await getSlashCommand(
    "earn"
  )} or ${await getSlashCommand("deposit")} `

  const embed = composeEmbedMessage(null, {
    author: [
      `How many ${tokenObj.token.symbol} to withdraw ? `,
      getEmojiURL(emojis.NFT2),
    ],
    description: isNotEmpty ? text : emptyText,
  }).addFields(
    {
      name: "Preview transaction",
      value: `Withdraw \`${error ? 0 : amount}\` ${getEmojiToken(
        tokenObj.token.symbol as TokenEmojiKey
      )} \`${tokenObj.token.symbol || "???"}\``,
    },
    ...(error ? [{ name: "Error", value: `\`\`\`${error}\`\`\`` }] : [])
  )

  return {
    context: {
      ...params,
      token: tokenObj.token.symbol,
      tokenObj,
      amount,
    },
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          ...[10, 25, 50].map((p) =>
            new MessageButton()
              .setLabel(`${p}%`)
              .setStyle("SECONDARY")
              .setCustomId(`select_amount_${p}`)
          ),
          new MessageButton()
            .setLabel("All")
            .setStyle("SECONDARY")
            .setCustomId(`select_amount_100`),
          new MessageButton()
            .setLabel("Custom")
            .setStyle("SECONDARY")
            .setCustomId("enter_amount")
        ),
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel("Continue")
            .setCustomId("continue")
            .setStyle("PRIMARY")
            .setDisabled(!!error || Number(amount) <= 0)
        ),
      ],
    },
  }
}

// select token
export async function withdrawStep1(
  interaction: CommandInteraction | SelectMenuInteraction,
  filterSymbol?: string
) {
  const balances = await getBalances(interaction)

  const filteredBals = balances.filter(
    (b) => !filterSymbol || equalIgnoreCase(b.token.symbol, filterSymbol)
  )

  if (interaction.isSelectMenu() || filteredBals.length === 1) {
    let tokenObj
    if (interaction.isSelectMenu()) {
      const tokenId = interaction.values[0]
      tokenObj = balances.find((b) => b.id === tokenId)
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

  const { text } = formatView("compact", "filter-dust", filteredBals)
  const isNotEmpty = !!text
  const emptyText = `${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true
  )} You have nothing yet, use ${await getSlashCommand(
    "earn"
  )} or ${await getSlashCommand("deposit")} `

  const embed = composeEmbedMessage(null, {
    author: ["Choose your money source", getEmojiURL(emojis.NFT2)],
    description: isNotEmpty ? text : emptyText,
  })

  const isDuplicateSymbol = (s: string) =>
    balances.filter((b: any) => b.token.symbol.toUpperCase() === s).length > 1

  return {
    context: {
      amount: "%0",
    },
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setPlaceholder("💵 Choose money source")
            .setCustomId("select_token")
            .setOptions(
              balances.map((b: any) => ({
                label: `${b.token.symbol}${
                  isDuplicateSymbol(b.token.symbol)
                    ? ` (${b.token.chain.symbol})`
                    : ""
                }`,
                value: b.id,
                emoji: getEmojiToken(b.token.symbol),
              }))
            )
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
      `${getEmoji("CHECK")} Your withdraw is underway`,
      `${getEmoji("CHECK")} Mochi will DM you with the tx link shortly.`,
    ].join("\n"),
  })
}

export async function executeWithdraw(interaction: ButtonInteraction) {
  const payload = await CacheManager.get({
    pool: "withdraw-request-payload",
    key: interaction.user.id,
    call: () => Promise.resolve(null),
  })

  // withdraw
  const { ok, error, log, curl } = await mochiPay.withdraw(payload)
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
    MOCHI_ACTION_WITHDRAW
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
            "Your request has been submitted and result will be sent to your DM, but "
          ),
        ],
      },
    }

  return { msgOpts: null }
}
