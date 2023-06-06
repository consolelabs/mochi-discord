import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageSelectMenu,
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
}

async function validate(params: Params) {
  const { address = "", amount, token } = params
  const validParams = {
    amount: "0",
    token: "",
    address,
  }

  if (amount && isValidAmount({ arg: amount, exceptions: ["all"] })) {
    validParams.amount = amount
  }

  if (token && (await isTokenSupported(token))) {
    validParams.token = token
  }

  return validParams
}

CacheManager.init({
  pool: "withdraw-request",
  ttl: 0,
  checkperiod: 0,
})

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
  if (Number.isNaN(parsedAmount)) {
    return { valid: false, error: "Value is not a number." }
  } else if (parsedAmount < 0) {
    return { valid: false, error: "The amount you just entered is negative." }
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
    token,
  }
}

export async function confirmWithdraw(i: ButtonInteraction, address: string) {
  const { token, amount, tokenObj } = await CacheManager.get({
    pool: "withdraw-request",
    key: i.user.id,
    call: () => Promise.resolve({}),
  })

  const { valid } = isAddress(address)

  if (valid) {
    await savePayload(i, {
      address,
      chainId: tokenObj.token.chain.chain_id,
      decimal: tokenObj.token.decimal,
      token,
      amount,
    })
  }

  return {
    embeds: [
      composeEmbedMessage(null, {
        author: ["Confirm withdrawal", getEmojiURL(emojis.ANIMATED_WITHDRAW)],
        description: [
          `${getEmoji("WALLET_1")}\`Address.  ${shortenHashOrAddress(
            address,
            5,
            5
          )}\``,
          `${getEmoji("SWAP_ROUTE")}\`Network.  \`${tokenObj.token.chain.name}`,
          `${getEmoji("SWAP_ROUTE")}\`Source.   \`Mochi wallet`,
          `${getEmoji("ANIMATED_COIN_1", true)}\`Coin.     \`${token}`,
          `${getEmoji("NFT2")}\`Amount.   \`${getEmojiToken(
            token
          )} **${amount} ${token}**`,
          `${getEmoji("CASH")}\`Fee.      \`? ${token}`,
        ].join("\n"),
      }),
    ],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton({
          style: "PRIMARY",
          label: "Submit",
          customId: "submit",
          disabled: !valid,
        })
      ),
    ],
  }
}

export async function withdrawWithParams(
  interaction: CommandInteraction | MessageComponentInteraction,
  token: string,
  amount: string
) {
  const bals = await getBalances(interaction)
  const {
    valid,
    error,
    token: tokenObj,
  } = checkCommitableOperation(bals, amount, token)
  if (!valid && error) {
    return {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Withdraw error", getEmojiURL(emojis.ANIMATED_WITHDRAW)],
          description: error,
        }),
      ],
    }
  }

  const dmEmbed = composeEmbedMessage(null, {
    author: ["Withdraw", getEmojiURL(emojis.ANIMATED_WITHDRAW)],
    description: `** Withdrawal amount **\n${getEmojiToken(
      token as TokenEmojiKey
    )} ${amount} ${token.toUpperCase()}\nPlease enter your ** ${token.toUpperCase()} ** destination address that you want to withdraw your tokens.`,
  })

  await CacheManager.set({
    pool: "withdraw-request",
    key: interaction.user.id,
    val: { token, amount, tokenObj } as any,
  })

  return {
    embeds: [dmEmbed],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton({
          label: "Enter address",
          style: "SECONDARY",
          customId: "modal_enter_address/custom_address/Destination Address",
        })
      ),
    ],
  }
}

async function savePayload(
  i: CommandInteraction | MessageComponentInteraction,
  {
    address,
    amount,
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
  const payload = {
    address,
    profileId,
    // TODO: handle "all" case
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

export async function preWithdraw(
  interaction: CommandInteraction | MessageComponentInteraction,
  params: Params = {}
) {
  const balances = await getBalances(interaction)
  const { valid, token, error } = checkCommitableOperation(
    balances,
    "0",
    params.token ?? ""
  )

  if (!valid && error) {
    return {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Withdraw error", getEmojiURL(emojis.ANIMATED_WITHDRAW)],
          description: error,
        }),
      ],
    }
  }

  return withdraw(interaction, { ...params, token: token.id })
}

export async function withdraw(
  interaction: CommandInteraction | MessageComponentInteraction,
  params: Params = {}
) {
  const balances = await getBalances(interaction)

  const savedParams = await CacheManager.get({
    pool: "withdraw-request",
    key: interaction.user.id,
    call: () => Promise.resolve(params),
  })

  const mergedParams: any = {
    ...savedParams,
    ...params,
  }

  const tokenObj = balances.find((b) => b.id === mergedParams.token)

  mergedParams.tokenObj = tokenObj

  await CacheManager.set({
    pool: "withdraw-request",
    key: interaction.user.id,
    val: mergedParams,
  })

  let error: string | null = ""

  const tokenAmount = tokenObj?.amount ?? 0
  const tokenDecimal = tokenObj?.token.decimal ?? 0

  const getPercentage = (percent: number) =>
    BigNumber.from(tokenAmount).mul(percent).div(100).toString()

  const validParams = await validate({
    ...savedParams,
    address: mergedParams.address,
    // reset amount when switching tokens
    amount:
      params.token && mergedParams.token !== params.token
        ? undefined
        : mergedParams.amount,
  })

  validParams.token = tokenObj?.token.symbol

  if (mergedParams.amount?.startsWith("%")) {
    validParams.amount = formatDigit({
      value: utils.formatUnits(
        getPercentage(Number(mergedParams.amount.slice(1))),
        tokenDecimal
      ),
      fractionDigits: 0,
    })
  } else if (mergedParams.amount) {
    ;({ error } = checkCommitableOperation(
      balances,
      mergedParams.amount,
      validParams.token
    ))
  }

  const { text } = formatView(
    "compact",
    "filter-dust",
    balances.filter((b) => equalIgnoreCase(b.token.symbol, validParams.token))
  )
  const isNotEmpty = !!text
  const emptyText = `${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true
  )} You have nothing yet, use ${await getSlashCommand(
    "earn"
  )} or ${await getSlashCommand("deposit")} `

  const embed = composeEmbedMessage(null, {
    author: [
      `How many ${validParams.token.toUpperCase()} to withdraw?`,
      getEmojiURL(emojis.NFT2),
    ],
    description: isNotEmpty ? text : emptyText,
  }).addFields(
    {
      name: "Preview transaction",
      value: `Withdraw \`${validParams.amount}\` ${getEmojiToken(
        validParams.token as TokenEmojiKey
      )} \`${validParams.token || "???"}\``,
    },
    ...(error ? [{ name: "Error", value: `\`\`\`${error}\`\`\`` }] : [])
  )

  const canContinue =
    validParams.amount &&
    validParams.token &&
    validParams.amount
      .replaceAll("0", "")
      .replaceAll(".", "")
      .replaceAll(",", "").length

  if (canContinue) {
    await savePayload(interaction, {
      amount: validParams.amount,
      token: validParams.token,
      decimal: tokenDecimal,
      chainId: tokenObj.token.chain.chain_id,
    })
  }

  const isDuplicateSymbol = (s: string) =>
    balances.filter((b: any) => b.token.symbol.toUpperCase() === s).length > 1

  return {
    embeds: [embed],
    components: [
      ...(validParams.token
        ? []
        : [
            new MessageActionRow().addComponents(
              new MessageSelectMenu()
                .setCustomId("select_token/token")
                .setOptions(
                  balances.map((b: any) => ({
                    label: `${b.token.symbol}${
                      isDuplicateSymbol(b.token.symbol)
                        ? ` (${b.token.chain.symbol})`
                        : ""
                    }`,
                    value: b.id,
                    emoji: getEmojiToken(b.token.symbol),
                    default: equalIgnoreCase(b.token.symbol, validParams.token),
                  }))
                )
            ),
          ]),
      new MessageActionRow().addComponents(
        ...[10, 25, 50].map((p) =>
          new MessageButton()
            .setLabel(`${p}%`)
            .setStyle("SECONDARY")
            .setDisabled(!validParams.token)
            .setCustomId(`input_amount/amount/%${p}`)
        ),
        new MessageButton()
          .setLabel("All")
          .setStyle("SECONDARY")
          .setDisabled(!validParams.token)
          .setCustomId(`input_amount/amount/%100`),
        new MessageButton()
          .setLabel("Custom")
          .setStyle("SECONDARY")
          .setDisabled(!validParams.token)
          .setCustomId("modal_input_amount/custom_amount/Amount")
      ),
      new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("Continue")
          .setCustomId(`continue/${validParams.token}/${validParams.amount}`)
          .setStyle("PRIMARY")
          .setDisabled(!canContinue)
      ),
    ],
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
      embeds: [
        enableDMMessage(
          "Your request has been submitted and result will be sent to your DM, but "
        ),
      ],
    }

  return null
}
