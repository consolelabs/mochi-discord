import defi from "adapters/defi"
import profile from "adapters/profile"
import {
  ButtonInteraction,
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
  SelectMenuInteraction,
  User,
} from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import { InteractionHandler } from "handlers/discord/select-menu"
import { UserNFT } from "types/profile"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  defaultEmojis,
  emojis,
  equalIgnoreCase,
  getEmoji,
  getEmojiURL,
  isAddress,
  msgColors,
  reverseLookup,
  roundFloatNumber,
  shortenHashOrAddress,
} from "utils/common"
import { PREFIX } from "utils/constants"
import { renameWallet } from "../add/processor"

const chains: Record<string, string> = {
  "1": "Ethereum",
  "56": "Binance Smart Chain",
  "137": "Polygon",
  "250": "Fantom Opera",
}

// function composeWalletViewSelectMenuRow(address: string, type: string) {
//   return new MessageActionRow().addComponents(
//     new MessageSelectMenu({
//       custom_id: "wallet_view_select_menu",
//       options: [
//         {
//           label: "Assets",
//           value: `wallet_assets-${address}-${type}`,
//           default: true,
//         },
//         { label: "Transactions", value: `wallet_txns-${address}-${type}` },
//       ],
//     })
//   )
// }

function composeWalletDetailsButtonRow(
  userId: string,
  address: string,
  alias: string,
  added: boolean,
  type: string,
  view = "token"
) {
  return new MessageActionRow().addComponents(
    new MessageButton({
      customId: `wl_my_token-${userId}-${address}-${alias}-${type}-${added}`,
      emoji: getEmoji("ANIMATED_COIN_2"),
      style: "SECONDARY",
      label: "My Token",
      disabled: equalIgnoreCase(view, "token"),
    }),
    new MessageButton({
      customId: `wl_my_nft-${userId}-${address}-${alias}-${type}-${added}`,
      emoji: getEmoji("NFT2"),
      style: "SECONDARY",
      label: "My NFT",
      disabled: equalIgnoreCase(view, "nft"),
    }),
    new MessageButton({
      customId: `${
        added
          ? `wallet_remove_confirmation-${userId}-${address}-${alias}`
          : `wallet_add-${userId}-${address}`
      }`,
      style: "SECONDARY",
      label: added ? "Delete" : "Add to track list",
      emoji: getEmoji(added ? "BIN" : "PLUS"),
    }),
    new MessageButton({
      customId: `wallet_rename-${userId}-${address}`,
      style: "SECONDARY",
      emoji: getEmoji("PENCIL"),
      label: "Rename Label",
    })
  )
}

// function composeChainSelectMenuRow(address: string, type: string) {
//   return new MessageActionRow().addComponents(
//     new MessageSelectMenu({
//       custom_id: "wallet_chain_select_menu",
//       options: [
//         {
//           label: "All Chains",
//           value: `wallet_txns-${address}-${type}`,
//           default: true,
//         },
//         ...Object.entries(chains).map(([chainId, chainName]) => ({
//           label: chainName,
//           value: `wallet_txns-${address}-${type}-${chainId}`,
//         })),
//       ],
//     })
//   )
// }

export async function viewWallet(i: ButtonInteraction) {
  if (!i.customId.startsWith("wallet_view_details-")) return
  await i.deferReply()
  const address = i.customId.split("-")[1]
  const res = await viewWalletDetails(i.message as Message, i.user, address)
  await i.editReply(res.messageOptions)
  // const reply = await i.editReply(res.messageOptions)
  // InteractionManager.add(reply.id, res.interactionOptions)
}

export async function handleWalletRenaming(i: ButtonInteraction) {
  await (i.message as Message).edit({ components: [] })
  if (!i.customId.startsWith("wallet_rename-")) return
  const [userId, address] = i.customId.split("-").slice(1)
  if (i.user.id !== userId) {
    await i.deferUpdate()
    return
  }
  await i.deferReply()
  await renameWallet(i, userId, address)
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
    messageOptions: {
      embeds: [
        await getTokensEmbed(
          message,
          author,
          address,
          addressType,
          wallet?.alias
        ),
      ],
      components: [
        // composeWalletViewSelectMenuRow(address, addressType),
        composeWalletDetailsButtonRow(
          author.id,
          address,
          wallet?.alias,
          ok,
          addressType
        ),
      ],
    },
    // interactionOptions: {
    //   handler: selectWalletViewHandler,
    // },
  }
}

// export const selectWalletViewHandler: InteractionHandler = async (
//   msgOrInteraction
// ) => {
//   const interaction = msgOrInteraction as SelectMenuInteraction
//   await interaction.deferUpdate()
//   const { message } = <{ message: Message }>interaction
//   const input = interaction.values[0]
//   const [view, address, type, chainId] = input.split("-")

//   const { data: wallet } = await defi.findWallet(interaction.user.id, address)
//   const txView = view === "wallet_txns"
//   const embed = await (txView
//     ? getTxnsEmbed(msgOrInteraction, interaction.user, address, type, chainId)
//     : getAssetsEmbed(
//         msgOrInteraction,
//         interaction.user,
//         address,
//         type,
//         wallet?.alias
//       ))
//   const embed = await getAssetsEmbed(
//     msgOrInteraction,
//     interaction.user,
//     address,
//     type,
//     wallet?.alias
//   )

//   const viewRow: MessageActionRow | undefined = message.components.find((c) => {
//     return c.components[0].customId === "wallet_view_select_menu"
//   })
//   const viewSelectMenu = viewRow?.components[0] as MessageSelectMenu
//   const choices = ["wallet_assets", "wallet_txns"]
//   viewSelectMenu.options.forEach(
//     (opt, i) => (opt.default = i === choices.indexOf(view))
//   )

//   const chainRow = composeChainSelectMenuRow(address, type)
//   const chainSelectMenu = chainRow?.components[0] as MessageSelectMenu
//   chainSelectMenu.options.forEach(
//     (opt, i) =>
//       (opt.default =
//         i === (chainId ? Object.keys(chains).indexOf(chainId) + 1 : 0))
//   )

//   return {
//     messageOptions: {
//       embeds: [embed],
//       components: [
// ...(txView && type === "eth" ? [chainRow] : []),
//         ...(viewRow ? [viewRow] : []),
//       ],
//     },
//   }
// }

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
  } = await defi.getUserTrackingWallets(author.id)
  if (!ok)
    throw new APIError({ msgOrInteraction: message, description: log, curl })
  const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
  if (wallets.length === 0) {
    const embed = composeEmbedMessage(null, {
      author: ["Wallet list", getEmojiURL(emojis.TRANSACTIONS)],
      description: `You haven't added any wallet to the list.\n${pointingright} You can add more wallet by using \`${PREFIX}wallet add <wallet address> [alias]\`\n${pointingright} If you just want to check one wallet balance, you can directly command \`${PREFIX}wallet view <address>/<alias>\`.`,
      originalMsgAuthor: author,
      color: msgColors.SUCCESS,
    })
    return { messageOptions: { embeds: [embed] } }
  }
  const { alias, address, netWorth } = wallets.reduce(
    (acc: any, cur: any) => ({
      alias: `${acc.alias}\n${cur.alias || "-"}`,
      address: `${acc.address}\n${shortenHashOrAddress(cur.address)}`,
      netWorth: `${acc.netWorth}\n${
        cur.fetched_data ? `$${cur.net_worth.toLocaleString()}` : "-"
      }`,
    }),
    { alias: "", address: "", netWorth: "" }
  )
  const embed = composeEmbedMessage(null, {
    author: ["Wallet list", getEmojiURL(emojis.TRANSACTIONS)],
    originalMsgAuthor: author,
    color: msgColors.SUCCESS,
  }).addFields([
    { name: `${getEmoji("PAWCOIN")} Alias`, value: alias, inline: true },
    { name: `${getEmoji("ADDRESS")} Address`, value: address, inline: true },
    { name: `${getEmoji("COIN")} Net worth`, value: netWorth, inline: true },
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

async function getTokensEmbed(
  message: OriginalMessage,
  author: User,
  address: string,
  type: string,
  alias: string
) {
  const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
  const blank = getEmoji("BLANK")
  const {
    data: assets,
    ok,
    log,
    curl,
  } = await defi.getWalletAssets(author.id, address, type)
  if (!ok) {
    throw new APIError({
      msgOrInteraction: message,
      description: log,
      curl: curl,
    })
  }
  if (assets.length === 0) {
    return composeEmbedMessage(null, {
      author: ["Wallet balances", getEmojiURL(emojis.WALLET)],
      description: "No balance. Try `$deposit` more into your wallet.",
      originalMsgAuthor: author,
      color: msgColors.SUCCESS,
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
      if (usd_balance <= 1) return undefined
      const tokenEmoji = getEmoji(symbol)
      const value = `${tokenEmoji} ${asset_balance.toLocaleString()} ${symbol.toUpperCase()}\n\`$${usd_balance.toLocaleString(
        undefined,
        { maximumFractionDigits: 4 }
      )}\` ${blank}`
      return { name, value, inline: true }
    })
    .filter((f: EmbedFieldData | undefined) => Boolean(f))
  fields.push(
    ...[
      {
        name: `\u200B\nEstimated total (U.S dollar)`,
        value: `${getEmoji("CASH")} \`$${roundFloatNumber(
          totalUsdBalance,
          4
        )}\``,
        inline: false,
      },
      {
        name: "\u200B",
        value: `${pointingright} Your can withdraw the coin to you crypto wallet by \`$withdraw\`\n${pointingright} All the tip transaction will take from this balance. You can try \`$tip\``,
        inline: false,
      },
    ]
  )
  const label = alias || (await reverseLookup(address))
  const title = label ? `${label}'s wallet` : "Wallet tokens"
  return composeEmbedMessage(null, {
    author: [title, getEmojiURL(emojis.WALLET)],
    // description: `${pointingright} You can save the wallet address with an easy-to-remember alias for further tracking with $wallet.\n${pointingright} _Show maximum 25 tokens_`,
    description: `**Tokens (${Math.min(25, fields.length - 2)})**`,
    originalMsgAuthor: author,
    color: msgColors.SUCCESS,
  }).addFields(fields.slice(0, 25))
}

export async function getTxnsEmbed(
  message: OriginalMessage,
  author: User,
  address: string,
  type: string,
  chainId?: string
) {
  const { data, ok, log, curl } = await defi.getWalletTxns(
    author.id,
    address,
    type
  )
  if (!ok) {
    throw new APIError({
      msgOrInteraction: message,
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
      color: msgColors.SUCCESS,
      originalMsgAuthor: author,
    })
  }

  const reply = getEmoji("REPLY")
  const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
  const blank = getEmoji("BLANK")
  const transactions = txns.slice(0, 5).map((tx: any) => {
    const {
      tx_hash,
      scan_base_url,
      actions = [],
      successful,
      has_transfer,
    } = tx

    const events =
      (actions ?? []).reduce((acc: any, cur: any) => {
        const key = `${cur.from}-${cur.to}`
        const value: any[] = acc[key] ?? []
        value.push(cur)
        return {
          ...acc,
          [key]: value,
        }
      }, {}) ?? {}
    const details = Object.entries(events)
      .map(([key, value]: [string, any]) => {
        const [from, to] = key.split("-")
        const addresses = `${blank}${reply} \`${shortenHashOrAddress(
          from
        )}\` ${getEmoji("RIGHT_ARROW")} \`${shortenHashOrAddress(to)}\``
        if (has_transfer) {
          const transfers = value
            .map((action: any) => {
              const { amount, unit, native_transfer, contract } = action
              const tokenEmoji = getEmoji(unit)
              const transfferedAmount = `${
                amount > 0 ? "+" : ""
              }${roundFloatNumber(amount, 4)}`
              return `${blank.repeat(
                2
              )}${reply}${tokenEmoji} \`${transfferedAmount}\` ${
                native_transfer
                  ? unit
                  : `[${unit}](${scan_base_url}/token/${contract?.address})`
              }`
            })
            .join("\n")
          return `${addresses}\n${transfers}`
        }
      })
      .join("\n\n")
    return `${
      successful ? getEmoji("CHECK") : defaultEmojis.WARNING
    } [${shortenHashOrAddress(tx_hash)}](${scan_base_url}/tx/${tx_hash})${
      details ? `\n${details}` : ""
    }`
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
    color: msgColors.SUCCESS,
  })
}

export async function navigateWalletViews(i: ButtonInteraction) {
  await i.deferUpdate()
  // await i.deferReply()
  if (!i.customId.startsWith("wl_my_")) return
  const [prefix, userId, address, alias, type, added] = i.customId.split("-")
  if (i.user.id !== userId) return
  let embed: MessageEmbed | null = null
  let view = ""
  if (prefix.includes("token")) {
    view = "token"
    embed = await getTokensEmbed(i, i.user, address, type, alias)
  } else if (prefix.includes("nft")) {
    view = "nft"
    embed = await getNFTsEmbed(i, i.user, address, alias)
  }
  if (!embed) return
  const msg = i.message as Message
  await msg.edit({
    embeds: [embed],
    components: [
      composeWalletDetailsButtonRow(
        userId,
        address,
        alias,
        Boolean(added),
        type,
        view
      ),
    ],
  })
}

async function getNFTsEmbed(
  msgOrInteraction: OriginalMessage,
  author: User,
  address: string,
  alias: string
) {
  const userNFTs = await profile.getUserNFT({ userAddress: address })
  if (!userNFTs.ok) {
    throw new APIError({
      msgOrInteraction: msgOrInteraction,
      curl: userNFTs.curl,
      description: userNFTs.log,
    })
  }

  const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
  const fields: EmbedFieldData[] = await Promise.all(
    // group nfts by collection
    Object.entries(
      userNFTs.data.reduce((acc: Record<string, UserNFT[]>, cur) => {
        const nfts = acc[cur.collection_address] ?? []
        nfts.push(cur)
        return {
          ...acc,
          [cur.collection_address]: nfts,
        }
      }, {})
      // render embed fields
    ).map(async ([address, nfts]) => {
      const collections = await profile.getNftCollections({ address })
      const collection: any = collections.data?.[0]
      const collectionName =
        collection?.name ?? `Collection ${shortenHashOrAddress(address)}`
      const chainName = collection?.chain?.symbol
      const nftEmoji = getEmoji("NFT2")
      let length = 0
      const tokens = nfts
        .map((nft) => {
          const str = `${collection?.symbol ?? ""} #${nft.token_id}`
          length += str.length
          if (length >= 1024) return ""
          return str
        })
        .join("\n")
      return {
        name: `${nftEmoji} ${collectionName} ${
          chainName ? `(${chainName}) ` : ""
        }${nfts.length}`,
        value: tokens,
        inline: true,
      }
    })
  )
  fields.push(
    ...[
      {
        name: "\u200B",
        value: `${pointingright} Your can withdraw the coin to you crypto wallet by \`$withdraw\`\n${pointingright} All the tip transaction will take from this balance. You can try \`$tip\``,
        inline: false,
      },
    ]
  )
  const title = alias ? `${alias}'s wallet` : "Wallet's NFT"
  return composeEmbedMessage(null, {
    originalMsgAuthor: author,
    author: [title, getEmojiURL(emojis.WALLET)],
    description: `**My NFT(${userNFTs.data.length})**`,
  }).addFields(fields)
}
