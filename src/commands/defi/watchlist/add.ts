import { Command } from "types/common"
import {
  ButtonInteraction,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { defaultEmojis, thumbnails } from "utils/common"
import {
  composeDiscordSelectionRow,
  getSuccessEmbed,
  composeDiscordExitButton,
  composeEmbedMessage,
  getErrorEmbed,
} from "utils/discordEmbed"
import { Coin } from "types/defi"
import { PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"
import CacheManager from "utils/CacheManager"
import { handleUpdateWlError } from "../watchlist_slash"
import { InteractionHandler } from "utils/InteractionManager"

export async function addToWatchlist(interaction: ButtonInteraction) {
  const [coinId] = interaction.customId.split("|").slice(1)
  const { ok, error } = await defi.addToWatchlist({
    user_id: interaction.user.id,
    symbol: "",
    coin_gecko_id: coinId,
  })
  if (!ok) {
    if (error.toLowerCase().startsWith("conflict")) {
      interaction.reply({
        embeds: [
          getErrorEmbed({
            title: "Token already exists",
            description: "You already have this token in your watchlist",
          }),
        ],
      })
      return
    }
  }
  interaction.reply({
    embeds: [
      getSuccessEmbed({
        description: "Token has been added to your watchlist",
      }),
    ],
  })
}

const handler: InteractionHandler = async (msgOrInteraction) => {
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
    const { base_suggestions, target_suggestions } = data
    let options: MessageSelectOptionData[]
    if (!target_suggestions) {
      const opt = (coin: Coin): MessageSelectOptionData => ({
        label: `${coin.name}`,
        value: `${coin.symbol}_${coin.id}_${msg.author.id}`,
      })
      options = base_suggestions.map((b: Coin) => opt(b))
    } else {
      const opt = (base: Coin, target: Coin): MessageSelectOptionData => ({
        label: `${base.name} / ${target.name}`,
        value: `${base.symbol}/${target.symbol}_${base.id}/${target.id}_${msg.author.id}`,
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
          composeEmbedMessage(msg, {
            title: `${defaultEmojis.MAG} Multiple options found`,
            description: `Multiple tokens found for \`${symbol}\`.\nPlease select one of the following`,
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
