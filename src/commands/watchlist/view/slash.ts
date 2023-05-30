import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { collectButton, composeWatchlist, WatchListViewType } from "./processor"
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
    const messageOptions = await composeWatchlist(
      i.user,
      0,
      WatchListViewType.TOKEN
    )
    const reply = (await i.editReply(messageOptions)) as Message
    if (reply instanceof Message) {
      collectButton(reply, i.user)
    }

    return null
  },
  help: (interaction) =>
    Promise.resolve({
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
