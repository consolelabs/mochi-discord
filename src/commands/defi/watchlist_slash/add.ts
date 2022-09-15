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
import { Coin } from "types/defi"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import defi from "adapters/defi"
import CacheManager from "utils/CacheManager"
import { handleUpdateWlError } from "."

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const value = interaction.values[0]
  const [symbol, coinGeckoId, userId] = value.split("_")
  const { ok, error } = await defi.addToWatchlist({
    user_id: userId,
    symbol,
    coin_gecko_id: coinGeckoId,
  })
  if (!ok) handleUpdateWlError(msgOrInteraction, symbol, error)
  CacheManager.findAndRemove("watchlist", `watchlist-${userId}`)
  return {
    messageOptions: {
      embeds: [getSuccessEmbed({})],
      components: [],
    },
  }
}

const command: SlashCommand = {
  name: "add",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("add")
      .setDescription("Add a token to your watchlist.")
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription("The token which you wanna add to your watchlist.")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const symbol = interaction.options.getString("symbol", true)
    const userId = interaction.user.id
    const { data, ok, error } = await defi.addToWatchlist({
      user_id: userId,
      symbol,
    })
    if (!ok) handleUpdateWlError(interaction, symbol, error)
    // no data === add successfully
    if (!data) {
      CacheManager.findAndRemove("watchlist", `watchlist-${userId}`)
      return {
        messageOptions: { embeds: [getSuccessEmbed({})] },
      }
    }

    // allow selection
    const { suggestions } = data
    const opt = (coin: Coin): MessageSelectOptionData => ({
      label: `${coin.name} (${coin.symbol})`,
      value: `${coin.symbol}_${coin.id}_${interaction.user.id}`,
    })
    const selectRow = composeDiscordSelectionRow({
      customId: "watchlist_selection",
      placeholder: "Make a selection",
      options: suggestions.map((c: Coin) => opt(c)),
    })

    const found = suggestions
      .map(
        (c: { name: string; symbol: string }) => `**${c.name}** (${c.symbol})`
      )
      .join(", ")
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage2(interaction, {
            title: `${defaultEmojis.MAG} Multiple options found`,
            description: `Multiple tokens found for \`${symbol}\`: ${found}.\nPlease select one of the following`,
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
        title: "Add a token to your watchlist.",
        usage: `${PREFIX}watchlist add <symbol>`,
        examples: `${PREFIX}watchlist add eth`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
