import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandArgumentError, GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { CheckMarketplaceLink, SplitMarketplaceLink } from "utils/marketplace"
import { handleTokenAdd } from "../token/add"
import { handleTokenAddCustom } from "../token/addCustom"

const command: SlashCommand = {
  name: "add-custom",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("add-custom")
      .setDescription("Add a token to your customized server's list")
      .addStringOption((option) =>
        option
          .setName("address")
          .setDescription(
            "token's address. Example: 0x22c36BfdCef207F9c0CC941936eff94D4246d14A"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription("token's symbol. Example: BACC")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("chain")
          .setDescription("token's chain. Example: eth")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    const address = interaction.options.getString("address")
    const symbol = interaction.options.getString("symbol")
    const chain = interaction.options.getString("chain")
    if (!address || !symbol || !chain) {
      throw new CommandArgumentError({
        message: interaction,
        getHelpMessage: () => command.help(interaction),
      })
    }
    return {
      messageOptions: {
        ...(await handleTokenAddCustom(interaction.guildId, [
          "",
          "",
          address,
          symbol,
          chain,
        ])),
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}tokens add-custom <address> <symbol> <chain>`,
        examples: `${SLASH_PREFIX}tokens add-custom 0x22c36BfdCef207F9c0CC941936eff94D4246d14A BACC eth\n${SLASH_PREFIX}tokens add-custom 0xFBde54764f51415CB0E00765eA4383bc90EDCCE8 LB eth`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
