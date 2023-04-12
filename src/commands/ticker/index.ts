import { Command, SlashCommand } from "types/common"
import { PREFIX, TICKER_GITBOOK, DEFI_DEFAULT_FOOTER } from "utils/constants"
import { getEmoji, thumbnails } from "utils/common"
import { getCommandArguments } from "utils/commands"
import { composeEmbedMessage } from "ui/discord/embed"
import _default from "./default/text"
import { parseTickerQuery } from "utils/defi"
import { InternalError } from "errors"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import CacheManager from "cache/node-cache"
// text cmds
import ticker from "./index/text"
import compare from "./compare-token/text"
import comparefiat from "./compare-fiat/text"
// slash cmds
import tickerSlash from "./index/slash"
import compareSlash from "./compare-token/slash"
import comparefiatSlash from "./compare-fiat/slash"

CacheManager.init({
  ttl: 0,
  pool: "ticker",
  checkperiod: 1,
})

const actions: Record<string, Command> = {
  default: _default,
}

const textCmd: Command = {
  id: "ticker",
  command: "ticker",
  brief: "Token ticker",
  category: "Defi",
  allowDM: true,
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const [query] = args.slice(1)
    const { base, target, isCompare, isFiat } = parseTickerQuery(query)
    if (base === target) {
      throw new InternalError({
        msgOrInteraction: msg,
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
        return ticker(msg, base)
      case !isFiat:
        return compare(msg, base, target)
      case isFiat:
        return comparefiat(msg, base, target)
      default:
        break
    }
    return null
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        description: `Display/Compare coin prices and market cap. Data is fetched from [CoinGecko](https://coingecko.com/)`,
        usage: `${PREFIX}ticker <symbol> (crypto or fiat)\n${PREFIX}ticker <base>/<target> (crypto or fiat)\n${PREFIX}ticker <action>`,
        examples: `${PREFIX}ticker eth\n${PREFIX}ticker eur (eur/usd)\n${PREFIX}ticker btc/bnb\n${PREFIX}ticker gbp/sgd\n${PREFIX}ticker default eth`,
        document: TICKER_GITBOOK,
        footer: [DEFI_DEFAULT_FOOTER],
        includeCommandsList: true,
      }),
    ],
  }),
  aliases: ["tick"],
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 2,
  actions,
}

const slashCmd: SlashCommand = {
  name: "ticker",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("ticker")
      .setDescription("Show/Compare coins price and market cap")
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
  },
  run: async function (interaction: CommandInteraction) {
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
    switch (true) {
      case !isCompare:
        return tickerSlash(interaction, base)
      case !isFiat:
        return compareSlash(interaction, base, target)
      case isFiat:
        return comparefiatSlash(interaction, base, target)
      default:
        break
    }
    return null
  },
  help: async () => ({
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

export default { textCmd, slashCmd }
