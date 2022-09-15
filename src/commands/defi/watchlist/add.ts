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
import { Coin } from "types/defi"
import { PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"
import CacheManager from "utils/CacheManager"
import { handleUpdateWlError } from "../watchlist_slash"

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

const command: Command = {
  id: "watchlist_add",
  command: "add",
  brief: "Add a token to your watchlist.",
  category: "Defi",
  run: async (msg) => {
    const symbol = getCommandArguments(msg)[2]
    const userId = msg.author.id
    const { data, ok, error } = await defi.addToWatchlist({
      user_id: userId,
      symbol,
    })
    if (!ok) handleUpdateWlError(msg, symbol, error)
    // no data === add successfully
    if (!data) {
      CacheManager.findAndRemove("watchlist", `watchlist-${userId}`)
      return {
        messageOptions: {
          embeds: [
            getSuccessEmbed({
              title: "Successfully set!",
              description: `Token has been added successfully!`,
            }),
          ],
        },
      }
    }

    // allow selection
    const { suggestions } = data
    const opt = (coin: Coin): MessageSelectOptionData => ({
      label: `${coin.name} (${coin.symbol})`,
      value: `${coin.symbol}_${coin.id}_${msg.author.id}`,
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
          composeEmbedMessage(msg, {
            title: `${defaultEmojis.MAG} Multiple options found`,
            description: `Multiple tokens found for \`${symbol}\`: ${found}.\nPlease select one of the following`,
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
        title: "Add a token to your watchlist.",
        usage: `${PREFIX}watchlist add <symbol>`,
        examples: `${PREFIX}watchlist add eth`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
