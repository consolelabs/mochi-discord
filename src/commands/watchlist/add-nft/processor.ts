import {
  CommandInteraction,
  Message,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import { InteractionHandler } from "handlers/discord/select-menu"
import { handleUpdateWlError } from "../processor"
import { ResponseCollectionSuggestions } from "types/api"
import { composeDiscordExitButton } from "ui/discord/button"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { defaultEmojis, getEmoji, msgColors } from "utils/common"

export const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const value = interaction.values[0]
  const [symbol, address, chain, userId] = value.split("_")
  const { ok, error } = await defi.addNFTToWatchlist({
    user_id: userId,
    collection_symbol: symbol,
    collection_address: address,
    chain,
  })
  if (!ok) await handleUpdateWlError(msgOrInteraction, symbol, error)
  CacheManager.findAndRemove("watchlist", `watchlist-nft-${userId}`)
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Successfully set!",
          description: `**${symbol.toUpperCase()}** has been added successfully! To see your watchlist use \`$wl view\``,
        }),
      ],
      components: [],
    },
  }
}

export const addWatchlistNftCollection = async ({
  msgOrInteraction,
  userId,
  symbol,
}: {
  msgOrInteraction: Message | CommandInteraction
  userId: string
  symbol: string
}) => {
  const { data, ok, error } = await defi.addNFTToWatchlist({
    user_id: userId,
    collection_symbol: symbol,
  })
  if (!ok) await handleUpdateWlError(msgOrInteraction, symbol, error)
  // no data === add successfully
  if (!data) {
    CacheManager.findAndRemove("watchlist", `watchlist-nft-${userId}`)
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Successfully set!",
            description: `**${symbol.toUpperCase()}** has been added successfully! To see your watchlist use \`$wl view\``,
          }),
        ],
        components: [],
      },
    }
  }

  // allow selection
  const { suggestions = [] } = data
  if (!suggestions.length) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "Command Error",
            description: `\`${symbol}\` hasn't been supported.\n${defaultEmojis.POINT_RIGHT} Please choose one in our supported \`$nft list\`!\n${defaultEmojis.POINT_RIGHT} To add your collection, run \`$nft add\`.`,
          }),
        ],
        components: [],
      },
    }
  }

  const opt = (
    collection: ResponseCollectionSuggestions
  ): MessageSelectOptionData => ({
    label: `${collection.name} (${collection.symbol})`,
    value: `${collection.symbol}_${collection.address}_${collection.chain}_${userId}`,
  })
  const selectRow = composeDiscordSelectionRow({
    customId: "watchlist_nft_selection",
    placeholder: "Make a selection",
    options: suggestions.map(opt),
  })

  const found = suggestions.map((c) => `**${c.name}** (${c.symbol})`).join(", ")
  const msgOpts =
    msgOrInteraction.type === "DEFAULT"
      ? {
          embeds: [
            composeEmbedMessage(null, {
              title: `${getEmoji("MAG")} Multiple options found`,
              description: `Multiple collections found for \`${symbol}\`: ${found}.\nPlease select one of the following`,
              color: msgColors.GRAY,
            }),
          ],
          components: [selectRow, composeDiscordExitButton(userId)],
        }
      : {
          embeds: [
            composeEmbedMessage(msgOrInteraction as CommandInteraction, {
              title: `${getEmoji("MAG")} Multiple options found`,
              description: `Multiple collections found for \`${symbol}\`: ${found}.\nPlease select one of the following`,
              color: msgColors.GRAY,
            }),
          ],
          components: [selectRow, composeDiscordExitButton(userId)],
        }
  return {
    messageOptions: msgOpts,
    interactionOptions: {
      handler,
    },
  }
}
