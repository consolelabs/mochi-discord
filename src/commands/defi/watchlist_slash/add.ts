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
          .setDescription(
            "The ticker/pair which you wanna add to your watchlist."
          )
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
    const { base_suggestions, target_suggestions } = data
    let options: MessageSelectOptionData[]
    if (!target_suggestions) {
      const opt = (coin: Coin): MessageSelectOptionData => ({
        label: `${coin.name}`,
        value: `${coin.symbol}_${coin.id}_${interaction.user.id}`,
      })
      options = base_suggestions.map((b: Coin) => opt(b))
    } else {
      const opt = (base: Coin, target: Coin): MessageSelectOptionData => ({
        label: `${base.name} / ${target.name}`,
        value: `${base.symbol}/${target.symbol}_${base.id}/${target.id}_${interaction.user.id}`,
      })
      options = base_suggestions
        .map((b: Coin) => target_suggestions.map((t: Coin) => opt(b, t)))
        .flat()
        .slice(0, 25) // discord allow maximum 25 options
    }
    const selectRow = composeDiscordSelectionRow({
      customId: "watchlist_selection",
      placeholder: "Make a selection",
      options,
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage2(interaction, {
            title: `${defaultEmojis.MAG} Multiple options found`,
            description: `Multiple tokens found for \`${symbol}\`.\nPlease select one of the following`,
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
