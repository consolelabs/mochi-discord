import { SlashCommand } from "types/common"
import {
  CommandInteraction,
  Message,
  MessageComponentInteraction,
} from "discord.js"
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
import addNFT from "./add-nft"
import removeNFT from "./remove-nft"
import CacheManager from "utils/CacheManager"
import { InternalError } from "errors"

export function handleUpdateWlError(
  msg: Message | MessageComponentInteraction | CommandInteraction | undefined,
  symbol: string,
  error: string | null,
  isRemove?: boolean
) {
  if (!msg) return
  let description = ""
  if (!error) {
    throw new InternalError({
      message: msg,
      description,
    })
  }
  switch (true) {
    case error.toLowerCase().startsWith("record not found"):
      description = `Token with symbol \`${symbol}\` ${
        isRemove ? "does not exist in your watchlist" : "is not supported"
      }.`
      break
    case error.toLowerCase().startsWith("conflict") && !isRemove:
      description = `Token existed. Please add another one!`
      break
    default:
      break
  }
  throw new InternalError({
    message: msg,
    description,
  })
}

CacheManager.init({
  ttl: 0,
  pool: "watchlist",
  checkperiod: 1,
})

const subCommands: Record<string, SlashCommand> = {
  view,
  add,
  "add-nft": addNFT,
  remove,
  "remove-nft": removeNFT,
}

const command: SlashCommand = {
  name: "watchlist",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("watchlist")
      .setDescription("Show list of your favorite tokens/nfts.")
    data.addSubcommand(<SlashCommandSubcommandBuilder>view.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>add.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>addNFT.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>remove.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeNFT.prepare())
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
