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
      .addBooleanOption((option) =>
        option
          .setName("no-default")
          .setDescription("option to disable default ticker. Example: true")
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const noDefault = interaction.options.getBoolean("no-default") || false
    const baseQ = interaction.options.getString("base", true)
    if (!interaction.guildId || !baseQ) return null
    const targetQ = interaction.options.getString("target")
    const query = `${baseQ}${targetQ ? `/${targetQ}` : ""}`
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
    await tickerSlash(interaction, base, target, isCompare, isFiat, noDefault)
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
