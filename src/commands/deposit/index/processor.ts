import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageAttachment,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { APIError, InternalError } from "errors"
import qrcode from "qrcode"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import { isEvm } from "utils/chain"
import {
  emojis,
  getAuthor,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  TokenEmojiKey,
} from "utils/common"

import mochiPay from "../../../adapters/mochi-pay"
import { getProfileIdByDiscord } from "../../../utils/profile"

export async function deposit(
  interaction: CommandInteraction | ButtonInteraction,
  token: string,
  amount: number,
) {
  const author = getAuthor(interaction)
  const symbol = token.toUpperCase()
  const res = await mochiPay.getTokens({
    symbol,
  })
  let tokens = []
  if (res.ok) {
    tokens = res.data.filter((t: any) => t.chain_id !== "0" && Boolean(t.chain))
  }
  if (tokens?.length < 1) {
    throw new InternalError({
      msgOrInteraction: interaction,
      title: "Unsupported token",
      descriptions: [
        "Please choose one in our supported `$token list` or `$moniker list`!",
        "To add your token, run `$token add`.",
      ],
      reason: `**${symbol}** hasn't been supported.`,
    })
  }

  const profileId = await getProfileIdByDiscord(author.id)
  const {
    ok,
    curl,
    log,
    data,
    status = 500,
    error,
  } = await mochiPay.deposit({
    profileId,
    token: symbol,
  })
  if (!ok) throw new APIError({ curl, description: log, status, error })

  const addressesDup = (data ?? []).filter(
    (d: any) => d.contract.chain.symbol && d.contract.address,
  )

  const addresses: Array<{
    address: string
    symbol: string
  }> = Array.from<any>(
    new Map(addressesDup.map((a: any) => [a.contract.id, a])).values(),
  ).map((a) => ({
    symbol: a.contract.chain.symbol.toUpperCase(),
    address: a.contract.address,
    decimal: a.token.decimal,
    chainId: Number(a.token.chain_id ?? 1),
    tokenAddress: a.token.address,
    chainType: a.contract.chain.type,
    isNative: a.token.native,
    explorer: a.contract.chain.explorer,
  }))

  return renderListDepositAddress({ addresses, amount, symbol })
}

export function renderListDepositAddress({
  addresses,
  amount = 1,
  symbol,
}: {
  addresses: any[]
  amount?: number
  symbol?: string
}) {
  if (!addresses.length)
    return {
      msgOpts: {
        embeds: [
          composeEmbedMessage(null, {
            author: [
              "Something went wrong",
              getEmojiURL(emojis.ANIMATED_MONEY),
            ],
            description: "We couldn't get the list address.",
          }),
        ],
      },
    }

  const dataRows = addresses.map((a) => {
    const link = isEvm(a.chainType)
      ? toMetamaskDeeplink(
          a.address,
          amount,
          a.decimal,
          a.chainId,
          !a.isNative ? a.tokenAddress : undefined,
        )
      : `${a.explorer}/address/${a.address}`
    return {
      ...a,
      symbol: `\`${a.symbol}\``,
      address: `[\`${a.address}\`](${link})`,
    }
  })

  const embed = composeEmbedMessage(null, {
    author: [
      `Deposit${symbol ? ` ${symbol}` : ""}`,
      getEmojiURL(emojis.ANIMATED_MONEY),
    ],
    description: [
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} Below is the deposit addresses on different chains.`,
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} Transactions take up to 5 minutes to process.`,
      getEmoji("LINE").repeat(5),
      formatDataTable(dataRows, {
        cols: ["symbol", "address"],
        alignment: ["left", "left"],
        noWrap: true,
        rowAfterFormatter: (f, i) =>
          `${getEmojiToken(addresses[i].symbol as TokenEmojiKey)} ${f}`,
      }).joined,
    ].join("\n"),
  })

  return {
    context: {
      addresses,
    },
    msgOpts: {
      files: [],
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu({
            placeholder: "💰 View an address",
            custom_id: "VIEW_DEPOSIT_ADDRESS",
            options: addresses.map((a) => ({
              label: a.address,
              value: a.symbol + "." + a.address,
              emoji: getEmojiToken(a.symbol as TokenEmojiKey),
            })),
          }),
        ),
      ],
    },
  }
}

function toMetamaskDeeplink(
  address: string,
  value: number,
  decimal: number,
  chainId: number,
  tokenAddress?: string,
) {
  let link = "https://metamask.app.link/send"
  if (tokenAddress) {
    link += `/${tokenAddress}@${chainId}/transfer?address=${address}`

    if (value > 0) {
      link += `&uint256=${value}e${decimal}`
    }

    return link
  }

  link += `/${address}@${chainId}`

  if (value > 0) {
    link += `?value=${value}e18`
  }

  return link
}

export async function depositDetail(
  i: SelectMenuInteraction,
  amount: number,
  depositObj: any,
) {
  let link
  // create QR code image
  if (isEvm(depositObj.chainType)) {
    link = toMetamaskDeeplink(
      i.values.at(0) ?? "",
      amount,
      depositObj.decimal,
      depositObj.chainId,
      !depositObj.isNative ? depositObj.tokenAddress : undefined,
    )
  } else {
    link = `${depositObj.explorer}/address/${depositObj.address}`
  }
  const buffer = await qrcode.toBuffer(link)
  const file = new MessageAttachment(buffer, "qr.png")

  const embed = composeEmbedMessage(null, {
    author: [
      depositObj.symbol,
      getEmojiURL(emojis[depositObj.symbol as keyof typeof emojis]),
    ],
    description: [
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} Transactions take up to 5 minutes to process.`,
      ...(isEvm(depositObj.chainType)
        ? [`${getEmoji("METAMASK")} Scan QR to auto-fill in Metamask.`]
        : []),
      getEmoji("LINE").repeat(5),
      `:chains:\`Chain.   \`${getEmojiToken(depositObj.symbol)} **${
        depositObj.symbol
      }**`,
      `${getEmoji("WALLET_2")}\`Address. \`[\`${
        depositObj.address
      }\`](${link})`,
    ].join("\n"),
    thumbnail: `attachment://qr.png`,
  })

  return {
    embeds: [embed],
    files: [file],
  }
}

/**
 * remove deposit address after get expired (3h)
 *
 *  -> force users to reuse $deposit
 *
 *  -> prevent users from depositing to wrong / expired contract
 *
 * @param toEdit
 * @param token
 */
// async function handleDepositExpiration(toEdit: Message, token: string) {
//   const expiredEmbed = getErrorEmbed({
//     title: `The ${token} deposit addresses has expired`,
//     description: `Please re-run ${await getSlashCommand(
//       "deposit"
//     )} to get the new address. If you have deposited but the balance was not topped up, contact the team via [Mochi Server](${MOCHI_SERVER_INVITE_URL}).`,
//   })
//   setTimeout(() => {
//     toEdit.edit({
//       embeds: [expiredEmbed],
//       files: [],
//     })
//   }, 10800000)
// }
