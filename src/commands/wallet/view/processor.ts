import defi from "adapters/defi"
import {
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageSelectMenu,
  SelectMenuInteraction,
  User,
} from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import { InteractionHandler } from "handlers/discord/select-menu"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  isAddress,
  roundFloatNumber,
  shortenHashOrAddress,
} from "utils/common"
import { PREFIX } from "utils/constants"

const chains: Record<string, string> = {
  "1": "Ethereum",
  "56": "Binance Smart Chain",
  "137": "Polygon",
  "250": "Fantom Opera",
}

function composeWalletViewSelectMenuRow(address: string) {
  return new MessageActionRow().addComponents(
    new MessageSelectMenu({
      custom_id: "wallet_view_select_menu",
      options: [
        { label: "Assets", value: `wallet_assets-${address}`, default: true },
        { label: "Transactions", value: `wallet_txns-${address}` },
      ],
    })
  )
}

function composeChainSelectMenuRow(address: string) {
  return new MessageActionRow().addComponents(
    new MessageSelectMenu({
      custom_id: "wallet_chain_select_menu",
      options: [
        {
          label: "All Chains",
          value: `wallet_txns-${address}`,
          default: true,
        },
        ...Object.entries(chains).map(([chainId, chainName]) => ({
          label: chainName,
          value: `wallet_txns-${address}-${chainId}`,
        })),
      ],
    })
  )
}

export async function viewWalletDetails(
  message: OriginalMessage,
  author: User,
  addressOrAlias: string
) {
  const {
    data: wallet,
    ok,
    status,
    log,
    curl,
  } = await defi.findWallet(author.id, addressOrAlias)
  if (!ok && status !== 404) {
    throw new APIError({ message, description: log, curl })
  }
  let address
  if (!ok) {
    // 1. address/alias not tracked yet
    address = addressOrAlias
    if (!isAddress(address)) {
      throw new InternalError({
        message,
        title: "Invalid address",
        description:
          "Your wallet address is invalid. Make sure that the wallet address is valid, you can copy-paste it to ensure the exactness of it.",
      })
    }
  } else {
    // 2. address/alias is being tracked
    address = wallet.address
  }
  return {
    messageOptions: {
      embeds: [await getAssetsEmbed(message, author, address)],
      components: [composeWalletViewSelectMenuRow(address)],
    },
    interactionOptions: {
      handler: selectWalletViewHandler,
    },
  }
}

export const selectWalletViewHandler: InteractionHandler = async (
  msgOrInteraction
) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  await interaction.deferUpdate()
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [type, address, chainId] = input.split("-")

  const txView = type === "wallet_txns"
  const embed = await (txView
    ? getTxnsEmbed(msgOrInteraction, interaction.user, address, chainId)
    : getAssetsEmbed(msgOrInteraction, interaction.user, address))

  const viewRow: MessageActionRow | undefined = message.components.find((c) => {
    return c.components[0].customId === "wallet_view_select_menu"
  })
  const viewSelectMenu = viewRow?.components[0] as MessageSelectMenu
  const choices = ["wallet_assets", "wallet_txns"]
  viewSelectMenu.options.forEach(
    (opt, i) => (opt.default = i === choices.indexOf(type))
  )

  const chainRow = composeChainSelectMenuRow(address)
  const chainSelectMenu = chainRow?.components[0] as MessageSelectMenu
  chainSelectMenu.options.forEach(
    (opt, i) =>
      (opt.default =
        i === (chainId ? Object.keys(chains).indexOf(chainId) + 1 : 0))
  )

  return {
    messageOptions: {
      embeds: [embed],
      components: [
        ...(txView ? [chainRow] : []),
        ...(viewRow ? [viewRow] : []),
      ],
    },
  }
}

function composeWalletSelectMenuRow(wallets: any) {
  return new MessageActionRow().addComponents(
    new MessageSelectMenu({
      custom_id: "wallet_list_select_menu",
      options: wallets.map((w: any) => {
        const addr = shortenHashOrAddress(w.address)
        return {
          label: w.alias ? `${w.alias} - ${addr}` : addr,
          value: w.address,
        }
      }),
    })
  )
}

const selectWalletHandler: InteractionHandler = async (msgOrInteraction) => {
  const i = msgOrInteraction as SelectMenuInteraction
  await i.deferUpdate()
  const { message } = <{ message: Message }>i
  const address = i.values[0]
  return await viewWalletDetails(message, i.user, address)
}

export async function viewWalletsList(message: OriginalMessage, author: User) {
  const {
    data: wallets,
    ok,
    log,
    curl,
  } = await defi.getUserWalletWatchlist(author.id)
  if (!ok) throw new APIError({ message, description: log, curl })
  const pointingright = getEmoji("pointingright")
  if (wallets.length === 0) {
    const embed = composeEmbedMessage(null, {
      author: ["Wallet list", getEmojiURL(emojis.TRANSACTIONS)],
      description: `You haven't added any wallet to the list.\n${pointingright} You can add more wallet by using \`${PREFIX}wallet add <wallet address> [alias]\`\n${pointingright} If you just want to check one wallet balance, you can directly command \`${PREFIX}wallet view <address>/<alias>\`.`,
      originalMsgAuthor: author,
    })
    return { messageOptions: { embeds: [embed] } }
  }
  const { alias, address, netWorth } = wallets.reduce(
    (acc: any, cur: any) => ({
      alias: `${acc.alias}\n${cur.alias || "-"}`,
      address: `${acc.address}\n${shortenHashOrAddress(cur.address)}`,
      netWorth: `${acc.netWorth}\n$${cur.net_worth.toLocaleString()}`,
    }),
    { alias: "", address: "", netWorth: "" }
  )
  const embed = composeEmbedMessage(null, {
    author: ["Wallet list", getEmojiURL(emojis.TRANSACTIONS)],
    originalMsgAuthor: author,
  }).addFields([
    { name: `${getEmoji("paw")} Alias`, value: alias, inline: true },
    { name: `${getEmoji("address")} Address`, value: address, inline: true },
    { name: `${getEmoji("coin")} Net worth`, value: netWorth, inline: true },
  ])
  return {
    messageOptions: {
      embeds: [embed],
      components: [composeWalletSelectMenuRow(wallets)],
    },
    interactionOptions: {
      handler: selectWalletHandler,
    },
  }
}

export async function getAssetsEmbed(
  message: OriginalMessage,
  author: User,
  address: string
) {
  const pointingright = getEmoji("pointingright")
  const blank = getEmoji("blank")
  const {
    data: assets,
    ok,
    log,
    curl,
  } = await defi.getWalletAssets(author.id, address)
  if (!ok) {
    throw new APIError({
      message,
      description: log,
      curl: curl,
    })
  }
  if (assets.length === 0) {
    return composeEmbedMessage(null, {
      author: ["Wallet balances", getEmojiURL(emojis.WALLET)],
      description: "No balance. Try `$deposit` more into your wallet.",
      originalMsgAuthor: author,
    })
  }
  const totalUsdBalance = assets.reduce((acc: number, cur: any) => {
    return acc + cur.usd_balance
  }, 0)
  const fields: EmbedFieldData[] = assets
    .map((a: any) => {
      const {
        contract_name: name,
        contract_symbol: symbol,
        asset_balance,
        usd_balance,
      } = a
      if (usd_balance === 0) return undefined
      const tokenEmoji = getEmoji(symbol)
      const value = `${tokenEmoji} ${asset_balance.toLocaleString()} ${symbol.toUpperCase()} \`$${usd_balance.toLocaleString(
        undefined,
        { maximumFractionDigits: 4 }
      )}\` ${blank}`
      return { name, value, inline: true }
    })
    .filter((f: EmbedFieldData | undefined) => Boolean(f))
  fields.push({
    name: `Estimated total (U.S dollar)`,
    value: `${getEmoji("cash")} \`$${roundFloatNumber(totalUsdBalance, 4)}\``,
  })
  return composeEmbedMessage(null, {
    author: ["Wallet balances", getEmojiURL(emojis.WALLET)],
    description: `${pointingright} Wallet address: \`${shortenHashOrAddress(
      address
    )}\`.\n${pointingright} You can save the wallet address with an easy-to-remember alias for further tracking with $wallet.\n${pointingright} _Show maximum 25 tokens_`,
    originalMsgAuthor: author,
  }).addFields(fields.slice(0, 25))
}

export async function getTxnsEmbed(
  message: OriginalMessage,
  author: User,
  address: string,
  chainId?: string
) {
  const { data, ok, log, curl } = await defi.getWalletTxns(author.id, address)
  if (!ok) {
    throw new APIError({
      message,
      description: log,
      curl: curl,
    })
  }
  const txns = chainId
    ? data.filter((item: any) => `${item.chain_id}` === chainId)
    : data
  if (!txns.length) {
    return composeEmbedMessage(null, {
      author: ["Wallet transactions", getEmojiURL(emojis.TRANSACTIONS)],
      description: `Wallet ${address} has no transactions${
        chainId ? ` on chain **${chains[chainId]}**` : ""
      }.`,
      originalMsgAuthor: author,
    })
  }
  const txEmojis: Record<string, string> = {
    transfer_nft: getEmoji("swap"),
    transfer_native: getEmoji("swap"),
    transfer_erc20: getEmoji("swap"),
    approval: getEmoji("approve"),
    contract_interaction: getEmoji("trade"),
  }
  const reply = getEmoji("reply")
  const pointingright = getEmoji("pointingright")
  const blank = getEmoji("blank")
  const transactions = txns.slice(0, 5).map((tx: any) => {
    const {
      type,
      amount,
      tx_hash,
      from,
      to,
      native_symbol,
      contract,
      tx_base_url,
      nfts: nftIds,
    } = tx
    const scanBaseUrl = tx_base_url.replace("/tx", "")

    const unit =
      type === "transfer_native"
        ? native_symbol
        : type === "transfer_erc20"
        ? contract?.symbol
        : type === "transfer_nft"
        ? "NFT"
        : ""
    const nfts =
      type === "transfer_nft"
        ? `\n${nftIds
            ?.map(
              (id: string) =>
                `${blank}${blank}${reply} [${contract?.name} ${id}](${scanBaseUrl}/token/${contract?.address})`
            )
            ?.join("\n")}`
        : ""
    const tokenEmoji = getEmoji(unit)
    const change = type.startsWith("transfer")
      ? `\n${blank}${reply} ${tokenEmoji} \`${
          amount > 0 ? "+" : ""
        }${roundFloatNumber(amount, 4)} ${unit}\``
      : ""
    return `${txEmojis[type]} [${shortenHashOrAddress(
      tx_hash
    )}](${tx_base_url}/${tx_hash})\n${blank}${reply} \`${shortenHashOrAddress(
      from
    )}\` ${getEmoji("right_arrow")} \`${shortenHashOrAddress(
      to
    )}\`${change}${nfts}`
  })
  const description = `${pointingright} Wallet address: \`${shortenHashOrAddress(
    address
  )}\`.\n${pointingright} 5 latest transactions${
    chainId ? ` on chain **${chains[chainId]}**` : ""
  }.`
  return composeEmbedMessage(null, {
    author: ["Wallet transactions", getEmojiURL(emojis.TRANSACTIONS)],
    description: `${description}\n\n${transactions.join("\n\n")}`,
    originalMsgAuthor: author,
  })
}
