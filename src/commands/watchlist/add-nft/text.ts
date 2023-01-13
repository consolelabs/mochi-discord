import { Command } from "types/common"
import { MessageSelectOptionData } from "discord.js"
import { defaultEmojis, thumbnails } from "utils/common"
import {
  getSuccessEmbed,
  composeEmbedMessage,
  getErrorEmbed,
} from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"
import CacheManager from "cache/node-cache"
import { ResponseCollectionSuggestions } from "types/api"
import { InternalError } from "errors"
import { handleUpdateWlError } from "../processor"
import { handler } from "./processor"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { composeDiscordExitButton } from "ui/discord/button"

const command: Command = {
  id: "watchlist_nft_add",
  command: "add-nft",
  brief: "Add a NFT to your watchlist.",
  category: "Defi",
  run: async (msg) => {
    const symbol = getCommandArguments(msg)[2]
    const userId = msg.author.id
    const { data, ok, error } = await defi.addNFTToWatchlist({
      user_id: userId,
      collection_symbol: symbol,
    })
    if (!ok) {
      if (error.toLowerCase().startsWith("conflict"))
        throw new InternalError({
          message: msg,
          title: "Command Error",
          description: `**${symbol}** has already been added.\n${defaultEmojis.POINT_RIGHT} Please choose another one in \`$nft list!\``,
        })
      else handleUpdateWlError(msg, symbol, error)
    }
    // no data === add successfully
    if (!data) {
      CacheManager.findAndRemove("watchlist", `watchlist-nft-${userId}`)
      return {
        messageOptions: {
          embeds: [
            getSuccessEmbed({
              title: "Successfully set!",
              description: `${symbol} has been added successfully! To see your watchlist use \`$wl view\``,
            }),
          ],
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
        },
      }
    }
    const opt = (
      collection: ResponseCollectionSuggestions
    ): MessageSelectOptionData => ({
      label: `${collection.name} (${collection.symbol})`,
      value: `${collection.symbol}_${collection.address}_${collection.chain}_${msg.author.id}`,
    })
    const selectRow = composeDiscordSelectionRow({
      customId: "watchlist_nft_selection",
      placeholder: "Make a selection",
      options: suggestions.map(opt),
    })

    const found = suggestions
      .map((c) => `**${c.name}** (${c.symbol})`)
      .join(", ")
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: `${defaultEmojis.MAG} Multiple options found`,
            description: `Multiple collections found for \`${symbol}\`: ${found}.\nPlease select one of the following`,
          }),
        ],
        components: [selectRow, composeDiscordExitButton(msg.author.id)],
      },
      interactionOptions: {
        handler,
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Add a NFT to your watchlist.",
        usage: `${PREFIX}watchlist add-nft <symbol>`,
        examples: `${PREFIX}watchlist add-nft neko`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
