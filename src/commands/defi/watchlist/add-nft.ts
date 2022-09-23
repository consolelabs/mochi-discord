import { Command } from "types/common"
import { MessageSelectOptionData, SelectMenuInteraction } from "discord.js"
import { defaultEmojis, thumbnails } from "utils/common"
import {
  composeDiscordSelectionRow,
  getSuccessEmbed,
  composeDiscordExitButton,
  composeEmbedMessage,
} from "utils/discordEmbed"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"
import CacheManager from "utils/CacheManager"
import { handleUpdateWlError } from "../watchlist_slash"
import { ResponseCollectionSuggestions } from "types/api"

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const value = interaction.values[0]
  const [symbol, address, chain, userId] = value.split("_")
  const { ok, error } = await defi.addNFTToWatchlist({
    user_id: userId,
    collection_symbol: symbol,
    collection_address: address,
    chain,
  })
  if (!ok) handleUpdateWlError(msgOrInteraction, symbol, error)
  CacheManager.findAndRemove("watchlist", `watchlist-nft-${userId}`)
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Successfully set!",
          description: `${symbol} has been added successfully! To see your watchlist use \`$wl view\``,
        }),
      ],
      components: [],
    },
  }
}

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
    if (!ok) handleUpdateWlError(msg, symbol, error)
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
      commandChoiceOptions: {
        userId: msg.author.id,
        guildId: msg.guildId,
        channelId: msg.channelId,
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
