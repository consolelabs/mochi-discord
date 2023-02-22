import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { CheckMarketplaceLink, SplitMarketplaceLink } from "utils/marketplace"
import { executeNftIntegrateCommand } from "./processor"

const command: SlashCommand = {
  name: "integrate",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("integrate")
      .setDescription("Integrate an NFT collection")
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
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }

    const address = interaction.options.getString("address") ?? ""
    let chain = interaction.options.getString("chain")

    if (!chain) {
      if (CheckMarketplaceLink(address)) chain = SplitMarketplaceLink(address)
      else return { messageOptions: await this.help(interaction) }
    }

    return await executeNftIntegrateCommand(
      address,
      chain,
      interaction.user.id,
      interaction.guildId,
      undefined
    )
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}nft integrate <address> <chain_id>`,
        examples: `${SLASH_PREFIX}nft integrate 0xFBde54764f51415CB0E00765eA4383bc90EDCCE8 5\n${SLASH_PREFIX}mochi integrate 0x51081a152db09d3FfF75807329A3A8b538eCf73b ftm`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
