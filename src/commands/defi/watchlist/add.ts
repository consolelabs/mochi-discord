import { Command } from "types/common"
import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageComponentInteraction,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { defaultEmojis, thumbnails } from "utils/common"
import {
  composeDiscordSelectionRow,
  getSuccessEmbed,
  composeDiscordExitButton,
  composeEmbedMessage,
} from "utils/discordEmbed"
import { Coin } from "types/defi"
import { PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"
import CacheManager from "utils/CacheManager"
import { handleUpdateWlError } from "../watchlist_slash"
import { InteractionHandler } from "utils/InteractionManager"
import { parseFiatQuery } from "utils/defi"

export async function addToWatchlist(interaction: ButtonInteraction) {
  // deferUpdate because we will edit the message later
  if (!interaction.deferred) {
    interaction.deferUpdate()
  }
  const msg = interaction.message as Message
  const [coinId, symbol] = interaction.customId.split("|").slice(1)
  await addUserWatchlist(msg, interaction.user.id, symbol, coinId)

  // disable + change the label of the add button
  const addButton = interaction.message.components?.at(1)?.components.at(2)
  if (
    addButton?.type === "BUTTON" &&
    addButton.customId?.startsWith("ticker_add_wl")
  ) {
    addButton.setDisabled(true)
    addButton.setLabel("Added to watchlist")

    msg.components?.at(1)?.components.splice(2, 1, addButton)
    msg.edit({
      components: msg.components,
    })
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
  coinId = ""
) {
  // const symbols = symbol.split("/")
  const fiats = parseFiatQuery(symbol)
  if (fiats.length) symbol = fiats.join("/")

  const { data, ok, error } = await defi.addToWatchlist({
    user_id: userId,
    symbol,
    coin_gecko_id: coinId,
    is_fiat: !!fiats.length,
  })
  if (!ok) handleUpdateWlError(msgOrInteraction, symbol, error)
  CacheManager.findAndRemove("watchlist", `watchlist-${userId}`)
  return data
}

const handler: InteractionHandler = async (msgOrInteraction) => {
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
    ...(await viewWatchlist({
      msg: message,
      symbols: remainingSymbols,
      userId,
    })),
    interactionHandlerOptions: {
      handler,
    },
  }
}

export async function viewWatchlist({
  msg,
  interaction,
  symbols,
  userId,
}: {
  msg?: Message
  interaction?: CommandInteraction
  symbols: string[]
  userId: string
}) {
  for (const [i, symbol] of symbols.entries()) {
    const data = await addUserWatchlist(msg ?? interaction, userId, symbol)
    // no data === add successfully
    if (!data) continue

    // allow selection
    const { base_suggestions, target_suggestions } = data
    let options: MessageSelectOptionData[]
    if (!target_suggestions) {
      const opt = (coin: Coin): MessageSelectOptionData => ({
        label: `${coin.name}`,
        value: `${coin.symbol}_${coin.id}_${userId}`,
      })
      options = base_suggestions.map((b: Coin) => opt(b))
    } else {
      const opt = (base: Coin, target: Coin): MessageSelectOptionData => ({
        label: `${base.name} / ${target.name}`,
        value: `${base.symbol}/${target.symbol}_${base.id}/${target.id}_${userId}`,
      })
      options = base_suggestions
        .map((b: Coin) => target_suggestions.map((t: Coin) => opt(b, t)))
        .flat()
        .slice(0, 25) // discord allow maximum 25 options
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
            title: `${defaultEmojis.MAG} Multiple options found`,
            description: `Multiple tokens found for \`${symbol}\`.\nPlease select one of the following`,
          }),
        ],
        components: [selectRow, composeDiscordExitButton(userId)],
      },
      interactionOptions: {
        handler,
      },
    }
  }

  CacheManager.findAndRemove("watchlist", `watchlist-${userId}`)
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Successfully set!",
          description: `Token(s) has been added successfully!`,
        }),
      ],
      components: [],
    },
  }
}

const command: Command = {
  id: "watchlist_add",
  command: "add",
  brief: "Add token(s0) to your watchlist.",
  category: "Defi",
  run: async (msg) => {
    const symbols = getCommandArguments(msg)
      .slice(2)
      .map((s) => s.trim())
      .filter((s) => !!s)
    return await viewWatchlist({ msg, symbols, userId: msg.author.id })
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Add token(s) to your watchlist.",
        usage: `${PREFIX}wl add <symbol1 symbol2 ...>`,
        examples: `${PREFIX}wl add eth\n${PREFIX}wl add ftm btc/sol matic`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
