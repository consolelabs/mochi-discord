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
import { EmojiKey, emojis, getEmoji, getEmojiURL } from "utils/common"
import {
  getSuccessEmbed,
  composeEmbedMessage,
  formatDataTable,
} from "ui/discord/embed"
import { Coin } from "types/defi"
import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import { parseTickerQuery } from "utils/defi"
import { handleUpdateWlError } from "../processor"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { getSlashCommand } from "utils/commands"

export async function addToWatchlist(i: ButtonInteraction) {
  if (!i.deferred) i.deferUpdate()
  const msg = i.message as Message
  const [coinId, symbol] = i.customId.split("|").slice(1)
  await addUserWatchlist(msg, i.user.id, symbol, coinId)

  const rows = i.message
    .components as MessageActionRow<MessageActionRowComponent>[]
  const addBtn = rows
    .map((r) =>
      r.components.find((c) => c.customId?.startsWith("ticker_add_wl"))
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

export async function addUserWatchlist(
  msgOrInteraction:
    | Message
    | MessageComponentInteraction
    | CommandInteraction
    | undefined,
  userId: string,
  symbol: string,
  coinId = ""
) {
  const { isFiat, base, target } = parseTickerQuery(symbol)
  if (isFiat) symbol = `${base}/${target}`

  const { data, ok, error } = await defi.addToWatchlist({
    user_id: userId,
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

  for (const [i, symbol] of symbols.entries()) {
    const data = await addUserWatchlist(msg ?? interaction, userId, symbol)
    // no data === add successfully
    if (!data) continue

    // allow selection
    const { base_suggestions, target_suggestions } = data
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
      tokens = base_suggestions.map((b: Coin) =>
        target_suggestions.map((t: Coin) => ({
          name: `${b.name.slice(0, 10)}/${t.name.slice(0, 10)}`,
          symbol: `${b.symbol.toUpperCase()}/${t.symbol.toUpperCase()}`,
        }))
      )
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
                cols: ["name", "symbol"],
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
            originSymbols
          )} has been added to the watchlist`,
          description: `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} View watchlist with ${await getSlashCommand(
            "wlv"
          )} (alias for ${await getSlashCommand("watchlist view")})\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} To remove, use ${await getSlashCommand("watchlist remove")}`,
        }),
      ],
      components: [],
    },
  }
}
