import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageAttachment,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { APIError, InternalError } from "errors"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
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
import qrcode from "qrcode"

export async function deposit(
  interaction: CommandInteraction | ButtonInteraction,
  token: string
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
  const { ok, curl, log, data } = await mochiPay.deposit({
    profileId,
    token: symbol,
  })
  if (!ok) throw new APIError({ curl, description: log })

  const addressesDup = data.filter(
    (d: any) => d.contract.chain.symbol && d.contract.address
  )

  const addresses: Array<{
    address: string
    symbol: string
  }> = Array.from<any>(
    new Map(addressesDup.map((a: any) => [a.contract.address, a])).values()
  ).map((a) => ({
    symbol: a.contract.chain.symbol.toUpperCase(),
    address: a.contract.address,
    decimal: a.token.decimal,
    chainId: Number(a.token.chain_id ?? 1),
    tokenAddress: a.token.address,
    isEVM: a.contract.chain.is_evm,
    isNative: a.token.native,
  }))

  return renderListDepositAddress(addresses, symbol)
}

export function renderListDepositAddress(addresses: any[], symbol?: string) {
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

  const embed = composeEmbedMessage(null, {
    author: [
      `Deposit${symbol ? ` ${symbol}` : ""}`,
      getEmojiURL(emojis.ANIMATED_MONEY),
    ],
    description: [
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} Below is the deposit addresses on different chains.`,
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} Transactions take up to 5 minutes to process.`,
      getEmoji("LINE").repeat(5),
      formatDataTable(addresses, {
        cols: ["symbol", "address"],
        alignment: ["left", "left"],
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
              value: a.address,
              emoji: getEmojiToken(a.symbol as TokenEmojiKey),
            })),
          })
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
  tokenAddress?: string
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
  depositObj: any
) {
  let buffer
  // create QR code image
  if (depositObj.isEVM) {
    buffer = await qrcode.toBuffer(
      toMetamaskDeeplink(
        i.values.at(0) ?? "",
        amount,
        depositObj.decimal,
        depositObj.chainId,
        !depositObj.isNative ? depositObj.tokenAddress : undefined
      )
    )
  } else {
    buffer = await qrcode.toBuffer(i.values.at(0) ?? "")
  }
  const file = new MessageAttachment(buffer, "qr.png")

  const embed = composeEmbedMessage(null, {
    author: [
      depositObj.symbol,
      getEmojiURL(emojis[depositObj.symbol as keyof typeof emojis]),
    ],
    description: [
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} Transactions take up to 5 minutes to process.`,
      ...(depositObj.isEVM
        ? [`${getEmoji("METAMASK")} Scan QR to auto-fill in Metamask.`]
        : []),
      getEmoji("LINE").repeat(5),
      `:chains:\`Chain.   \`${getEmojiToken(depositObj.symbol)} **${
        depositObj.symbol
      }**`,
      `${getEmoji("WALLET_2")}\`Address. ${depositObj.address}\``,
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
