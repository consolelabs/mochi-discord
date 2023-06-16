import { SlashCommand } from "types/common"
import { PREFIX } from "utils/constants"
import { getEmoji, thumbnails } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { parseTickerQuery } from "utils/defi"
import { InternalError } from "errors"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import CacheManager from "cache/node-cache"
// slash cmds
import tickerSlash from "./index/slash"
import compareSlash from "./compare-token/slash"
import comparefiatSlash from "./compare-fiat/slash"

CacheManager.init({
  ttl: 0,
  pool: "ticker",
  checkperiod: 1,
})

const slashCmd: SlashCommand = {
  name: "ticker",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("ticker")
      .setDescription("Show/compare coins price and market cap")
      .addStringOption((option) =>
        option
          .setName("base")
          .setDescription(
            "the cryptocurrency which you wanna check price. Example: FTM"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("target")
          .setDescription(
            "the second cryptocurrency for comparison. Example: BTC"
          )
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("chain")
          .setDescription(
            "the blockchain network of the token. Example: BSC, ETH, FTM, etc."
          )
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const baseQ = interaction.options.getString("base", true)
    if (!interaction.guildId || !baseQ) return null
    const targetQ = interaction.options.getString("target")
    const query = `${baseQ}${targetQ ? `/${targetQ}` : ""}`
    const chain = interaction.options.getString("chain")
    const { base, target, isCompare, isFiat } = parseTickerQuery(query)
    if (base === target) {
      throw new InternalError({
        msgOrInteraction: interaction,
        title: "Ticker error",
        description: `${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} You need to enter **different** tokens/fiats for the base and target.\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} You cannot use only one for pair comparison (e.g: btc/btc).`,
      })
    }
    switch (true) {
      case !isCompare:
        return tickerSlash(interaction, base, chain || "")
      case !isFiat:
        return compareSlash(interaction, base, target)
      case isFiat:
        return comparefiatSlash(interaction, base, target)
      default:
        break
    }
    return null
  },
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          thumbnail: thumbnails.TOKENS,
          title: "Display/Compare coin price and market cap",
          description: `Data is fetched from [CoinGecko](https://coingecko.com/)`,
          usage: `${PREFIX}ticker <symbol> (crypto or fiat)\n${PREFIX}ticker <base>/<target> (crypto or fiat)\n${PREFIX}ticker <action>`,
          examples: `${PREFIX}ticker eth\n${PREFIX}ticker eur (eur/usd)\n${PREFIX}ticker btc/bnb\n${PREFIX}ticker gbp/sgd\n${PREFIX}ticker default eth`,
        }),
      ],
    }),
  colorType: "Defi",
}

export default { slashCmd }
