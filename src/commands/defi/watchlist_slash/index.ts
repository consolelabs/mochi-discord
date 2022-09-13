import { SlashCommand } from "types/common"
import { CommandInteraction } from "discord.js"
import { thumbnails } from "utils/common"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import view from "./view"
import add from "./add"
import remove from "./remove"
import CacheManager from "utils/CacheManager"

CacheManager.init({
  ttl: 0,
  pool: "watchlist",
  checkperiod: 1,
})

const subCommands: Record<string, SlashCommand> = {
  view,
  add,
  remove,
}

const command: SlashCommand = {
  name: "watchlist",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("watchlist")
      .setDescription("Show list of your favorite tokens.")
    data.addSubcommand(<SlashCommandSubcommandBuilder>view.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>add.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>remove.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Manage your watchlist",
        usage: `${PREFIX}watchlist <sub-command>`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
