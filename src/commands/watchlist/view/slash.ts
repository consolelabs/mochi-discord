import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import {
  collectSlashButton,
  composeSlashTokenWatchlist,
  setInteraction,
} from "./processor"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"

const command: SlashCommand = {
  name: "view",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("view")
      .setDescription("View your watchlist")
  },
  run: async function (i: CommandInteraction) {
    setInteraction(i)
    const { embeds, files, components } = await composeSlashTokenWatchlist(
      i.user.id
    )
    const replyMsg = await i.fetchReply()
    if (replyMsg instanceof Message) {
      collectSlashButton(replyMsg)
    }
    return {
      messageOptions: {
        embeds,
        components,
        files,
      },
    }
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Show list of your favorite tokens",
        description: `Data is fetched from [CoinGecko](https://coingecko.com/)`,
        usage: `${SLASH_PREFIX}watchlist view`,
        examples: `${SLASH_PREFIX}watchlist view`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
