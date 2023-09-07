import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { runDefaultTicker } from "./processor"
import CacheManager from "cache/node-cache"
import defi from "adapters/defi"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Setup default ticker for your guild")
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription("enter token symbol")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("default")
          .setDescription("enter a default value for ticker")
          .setRequired(true)
          .setAutocomplete(true),
      )
  },
  autocomplete: async function (i) {
    if (!i.guildId) {
      await i.respond([])
      return
    }
    const focusedValue = i.options.getFocused()
    const symbol = i.options.getString("symbol", true)
    const { data: coins } = await CacheManager.get({
      pool: "ticker",
      key: `ticker-search-${symbol}`,
      call: () => defi.searchCoins(symbol, ""),
    })

    await i.respond(
      coins
        .filter((d: any) =>
          d.name.toLowerCase().includes(focusedValue.toLowerCase()),
        )
        .map((d: any) => ({ name: d.name, value: d.id })),
    )
  },
  run: async function (interaction: CommandInteraction) {
    return await runDefaultTicker(interaction)
  },
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          usage: `${SLASH_PREFIX}default ticker set`,
          examples: `${SLASH_PREFIX}default ticker set ftm`,
          document: `${GM_GITBOOK}&action=default`,
        }),
      ],
    }),
  colorType: "Server",
}

export default command
