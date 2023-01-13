import { SlashCommand } from "types/common"
import { CommandInteraction, MessageSelectOptionData } from "discord.js"
import { defaultEmojis, thumbnails } from "utils/common"
import {
  getSuccessEmbed,
  composeEmbedMessage2,
  getErrorEmbed,
} from "discord/embed/ui"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import { ResponseCollectionSuggestions } from "types/api"
import { handleUpdateWlError } from "../processor"
import { handler } from "./processor"
import { composeDiscordSelectionRow } from "discord/select-menu/ui"
import { composeDiscordExitButton } from "discord/button/ui"

const command: SlashCommand = {
  name: "add-nft",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("add-nft")
      .setDescription("Add a NFT to your watchlist.")
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription(
            "The NFT which you wanna add to your watchlist. Example: Neko"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const symbol = interaction.options.getString("symbol", true)
    const userId = interaction.user.id
    const { data, ok, error } = await defi.addNFTToWatchlist({
      user_id: userId,
      collection_symbol: symbol,
    })
    if (!ok) handleUpdateWlError(interaction, symbol, error)
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
      value: `${collection.symbol}_${collection.address}_${collection.chain}_${interaction.user.id}`,
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
          composeEmbedMessage2(interaction, {
            title: `${defaultEmojis.MAG} Multiple options found`,
            description: `Multiple collections found for \`${symbol}\`: ${found}.\nPlease select one of the following`,
          }),
        ],
        components: [selectRow, composeDiscordExitButton(interaction.user.id)],
      },
      interactionOptions: {
        handler,
      },
    }
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Add a NFT to your watchlist.",
        usage: `${PREFIX}watchlist add-nft <symbol>`,
        examples: `${PREFIX}watchlist add-nft neko`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
