import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { ADD_COLLECTION_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { CheckMarketplaceLink, SplitMarketplaceLink } from "utils/marketplace"
import { callAPI, toEmbed } from "../nft/add"

const command: SlashCommand = {
  name: "add",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("add")
      .setDescription("Add an NFT collection")
      .addStringOption((option) =>
        option
          .setName("address")
          .setDescription(
            "NFT address or marketplace link. Example: 0x7acee5d0acc520fab33b3ea25d4feef1ffebde73"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("chain")
          .setDescription("NFT chain. Example: ftm")
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guild || !interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }

    const address = interaction.options.getString("address") ?? ""
    let chain = interaction.options.getString("chain")

    if (!chain) {
      if (CheckMarketplaceLink(address)) chain = SplitMarketplaceLink(address)
      else return { messageOptions: await this.help(interaction) }
    }

    const { storeCollectionRes, supportedChainsRes } = await callAPI(
      address,
      chain,
      interaction.user.id,
      interaction.guildId,
      undefined
    )

    return await toEmbed(storeCollectionRes, supportedChainsRes)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}nft add <address> <chain_id>`,
        examples: `${SLASH_PREFIX}nft add 0x51081a152db09d3FfF75807329A3A8b538eCf73b ftm\n${SLASH_PREFIX}mochi add 0xFBde54764f51415CB0E00765eA4383bc90EDCCE8 5\n${SLASH_PREFIX}nft add https://opensea.io/collection/tykes`,
        document: ADD_COLLECTION_GITBOOK,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
