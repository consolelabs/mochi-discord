import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageActionRowComponent,
  MessageButton,
  MessageComponentInteraction,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import {
  EmojiKey,
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  shortenHashOrAddress,
  TokenEmojiKey,
} from "utils/common"
import {
  getSuccessEmbed,
  composeEmbedMessage,
  formatDataTable,
} from "ui/discord/embed"
import { Coin } from "types/defi"
import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import {
  formatPercentDigit,
  formatUsdDigit,
  parseTickerQuery,
} from "utils/defi"
import { handleUpdateWlError } from "../processor"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { getSlashCommand } from "utils/commands"
import { getProfileIdByDiscord } from "utils/profile"

export async function addToWatchlist(i: ButtonInteraction) {
  if (!i.deferred) i.deferUpdate()
  const msg = i.message as Message
  const [coinId, symbol] = i.customId.split("|").slice(1)
  await addUserWatchlist(msg, i.user.id, symbol, coinId)

  const rows = i.message
    .components as MessageActionRow<MessageActionRowComponent>[]
  const addBtn = rows
    .map((r) =>
      r.components.find((c) => c.customId?.startsWith("ticker_add_wl")),
    )
    .filter((c) => Boolean(c))
    .at(0) as MessageButton
  if (!addBtn) return
  addBtn.setDisabled(true)
  addBtn.setLabel("Added to watchlist")

  msg.edit({
    components: msg.components,
  })
}

export async function addToWatchlistFromTicker(
  i: ButtonInteraction,
  userId: string,
  { to, baseCoin, ...rest }: Record<string, any>,
) {
  const msg = i.message as Message
  const data = await addUserWatchlist(
    msg,
    userId,
    baseCoin.symbol.toLowerCase(),
    baseCoin.id,
  )
  if (!data) return null

  const symbolString = (symbols: string[]) => {
    return symbols
      .map(function (s) {
        return s.toUpperCase()
      })
      .join(" ")
  }

  return {
    initial: "addWatchList",
    context: {
      to,
      baseCoin,
      ...rest,
    },
    msgOpts: {
      files: [],
      embeds: [
        getSuccessEmbed({
          title: `${symbolString([to])} has been added to the watchlist`,
          description: `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true,
          )} View watchlist with ${await getSlashCommand(
            "wlv",
          )} (alias for ${await getSlashCommand("watchlist view")})\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true,
          )} To remove, use ${await getSlashCommand("watchlist remove")}`,
        }),
      ],
      components: [],
    },
  }
}

export async function addUserWatchlist(
  msgOrInteraction:
    | Message
    | MessageComponentInteraction
    | CommandInteraction
    | undefined,
  userId: string,
  symbol: string,
  coinId = "",
) {
  const { isFiat, base, target } = parseTickerQuery(symbol)
  if (isFiat) symbol = `${base}/${target}`

  const profileId = await getProfileIdByDiscord(userId)
  const { data, ok, error } = await defi.trackToken({
    profile_id: profileId,
    symbol,
    coin_gecko_id: coinId,
    is_fiat: isFiat,
  })
  if (!ok) await handleUpdateWlError(msgOrInteraction, symbol, error)
  CacheManager.findAndRemove("watchlist", `watchlist-${userId}`)
  return data
}

const handler = (symbols: string[]) => async (msgOrInteraction: any) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const remainingSymbols = interaction.customId
    .slice(interaction.customId.indexOf("|") + 1)
    .split("|")
    .filter((s) => !!s)
  const value = interaction.values[0]
  const [symbol, coinGeckoId, userId] = value.split("_")
  const { message } = <{ message: Message }>interaction
  // TODO(tuand): get coin data then display
  await addUserWatchlist(msgOrInteraction, userId, symbol, coinGeckoId)
  return {
    ...(await addWatchlistToken({
      msg: message,
      symbols: remainingSymbols,
      originSymbols: symbols,
      userId,
    })),
    interactionHandlerOptions: {
      handler: handler(symbols),
    },
  }
}

export async function addWatchlistToken({
  msg,
  interaction,
  symbols,
  originSymbols,
  userId,
}: {
  msg?: Message
  interaction?: CommandInteraction
  originSymbols: string[]
  symbols: string[]
  userId: string
}) {
  const symbolString = (symbols: string[]) => {
    return symbols
      .map(function (s) {
        return s.toUpperCase()
      })
      .join(" ")
  }

  const fields = []

  for (const [i, symbol] of symbols.entries()) {
    const data = await addUserWatchlist(msg ?? interaction, userId, symbol)
    if (!data) continue

    const priceChangePercentage =
      data.base_coin?.market_data?.price_change_percentage_24h ?? 0
    const isUp = Math.sign(priceChangePercentage) === 1
    const price = data.base_coin?.market_data?.current_price?.usd ?? 0
    fields.push(
      {
        name: "Icon",
        value: getEmojiToken(symbol.toUpperCase() as TokenEmojiKey),
        inline: true,
      },
      {
        name: "Price",
        value: `$${formatUsdDigit(price)}`,
        inline: true,
      },
      {
        name: "Change 1D",
        value: `${formatPercentDigit(priceChangePercentage)}% ${
          priceChangePercentage !== 0
            ? getEmoji(isUp ? "ARROW_UP" : "ARROW_DOWN")
            : ""
        }`,
        inline: true,
      },
    )
    const { base_suggestions, target_suggestions } = data
    if (!base_suggestions && !target_suggestions) continue
    if (!base_suggestions.length && !target_suggestions.length) continue

    // allow selection
    let options: MessageSelectOptionData[]
    let tokens = []
    if (!target_suggestions) {
      const opt = (coin: Coin): MessageSelectOptionData => ({
        label: `${coin.name}`,
        value: `${coin.symbol}_${coin.id}_${userId}`,
      })
      options = base_suggestions.map((b: Coin) => opt(b))
      tokens = base_suggestions.map((b: Coin) => ({
        name: b.name,
        symbol: b.symbol.toUpperCase(),
      }))
    } else {
      const opt = (base: Coin, target: Coin): MessageSelectOptionData => ({
        label: `${base.name} / ${target.name}`,
        value: `${base.symbol}/${target.symbol}_${base.id}/${target.id}_${userId}`,
      })
      options = base_suggestions
        .map((b: Coin) => target_suggestions.map((t: Coin) => opt(b, t)))
        .flat()
        .slice(0, 25) // discord allow maximum 25 options
      tokens = base_suggestions
        .map((b: Coin) =>
          target_suggestions.map((t: Coin) => ({
            name: `${b.name}/${t.name}`,
            symbol: `${b.symbol.toUpperCase()}/${t.symbol.toUpperCase()}`,
            chain: `${b.asset_platform.shortname}`,
            address: `${shortenHashOrAddress(b.contract_address)}`,
          })),
        )
        .flat()
    }
    const selectRow = composeDiscordSelectionRow({
      customId: `watchlist_selection|${symbols.slice(i + 1).join("|")}`,
      placeholder: "Make a selection",
      options,
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: [
              "Multiple results found",
              getEmojiURL(emojis.ANIMATED_COIN_3),
            ],
            description: `We're not sure which \`${symbol.toUpperCase()}\`, select one:\n${
              formatDataTable(tokens, {
                cols: ["name", "symbol", "chain", "address"],
                rowAfterFormatter: (f, i) =>
                  `${getEmoji(`NUM_${i + 1}` as EmojiKey)}${f}`,
              }).joined
            }`,
          }),
        ],
        components: [selectRow],
      },
      interactionOptions: {
        handler: handler(originSymbols),
      },
    }
  }

  CacheManager.findAndRemove("watchlist", `watchlist-${userId}`)

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: `${symbolString(
            originSymbols,
          )} has been added to the watchlist`,
          description: `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true,
          )} View watchlist with ${await getSlashCommand(
            "wlv",
          )} (alias for ${await getSlashCommand("watchlist view")})\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true,
          )} To remove, use ${await getSlashCommand("watchlist remove")}`,
        }).addFields(fields),
      ],
      components: [],
    },
  }
}
