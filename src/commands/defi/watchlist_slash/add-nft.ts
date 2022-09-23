import { SlashCommand } from "types/common"
import {
  CommandInteraction,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { defaultEmojis, thumbnails } from "utils/common"
import {
  composeDiscordSelectionRow,
  getSuccessEmbed,
  composeDiscordExitButton,
  composeEmbedMessage2,
} from "utils/discordEmbed"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import defi from "adapters/defi"
import CacheManager from "utils/CacheManager"
import { handleUpdateWlError } from "."
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
  CacheManager.findAndRemove("watchlist-nft", `watchlist-nft-${userId}`)
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
          .setDescription("The NFT which you wanna add to your watchlist.")
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
      CacheManager.findAndRemove("watchlist-nft", `watchlist-nft-${userId}`)
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
      commandChoiceOptions: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
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
