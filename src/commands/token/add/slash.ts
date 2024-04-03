import { SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { process } from "./processor"
import { GuildIdNotFoundError } from "errors"

const command: SlashCommand = {
  name: "add",
  category: "Community",
  prepare: () => {
    const choices: [name: string, value: string][] = [
      ["Etherum", "eth"],
      ["Polygon", "matic"],
      ["Fantom", "ftm"],
      ["Solana", "sol"],
      ["BNB", "bsc"],
      ["Avalanche", "avax"],
      ["Optimism", "op"],
      ["Arbitrum", "arb"],
      ["Heco", "heco"],
      ["BitTorrent", "btt"],
      ["OKExChain ", "okc"],
      ["Moonriver", "movr"],
      ["Celo", "celo"],
      ["Metis", "metis"],
      ["Cronos", "cro"],
      ["Gnosis", "xdai"],
      ["Boba", "boba"],
      ["Onus", "onus"],
      ["Aptos", "apt"],
      ["Sui", "sui"],
      ["Aurora", "aurora"],
      ["Base", "base"],
    ].map((e) => [e[0].toLowerCase(), e[1]])

    return new SlashCommandSubcommandBuilder()
      .setName("add")
      .setDescription("Add a token to your server's list")
      .addStringOption((option) =>
        option
          .setName("address")
          .setDescription("Enter token contract address")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("chain")
          .setDescription("Select a network")
          .setChoices(choices)
          .setRequired(true),
      )
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    const address = interaction.options.getString("address", true)
    const chain = interaction.options.getString("chain", true)
    return await process(interaction, {
      user_discord_id: interaction.user.id,
      guild_id: interaction.guildId,
      channel_id: interaction.channelId,
      message_id: interaction.id,
      token_address: address,
      token_chain: chain,
    })
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}token add <address> <chain>`,
        examples: `${PREFIX}token add 0xE409E073eE7474C381BFD9b3f88920459 Fantom`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
