import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { trackWallet } from "./processor"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import { route } from "utils/router"
import { machineConfig } from "commands/wallet/common/tracking"

const command: SlashCommand = {
  name: "track",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("track")
      .setDescription("Track any wallet")
      .addStringOption((opt) =>
        opt
          .setName("address")
          .setDescription("the address to track")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("chain")
          .setDescription("the chain of that address")
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName("alias")
          .setDescription("something easier for you to remember")
          .setRequired(false)
      )
  },
  run: async function (i: CommandInteraction) {
    const address = i.options.getString("address", true)
    const chain = i.options.getString("chain", false) ?? "evm"
    const alias = i.options.getString("alias", false) ?? ""

    const { msgOpts, context } = await trackWallet(
      i,
      i.user,
      address,
      chain,
      alias
    )
    const reply = await i.editReply(msgOpts)

    route(reply as Message, i, machineConfig("walletTrack", context))
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
