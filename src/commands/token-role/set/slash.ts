import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { PREFIX, TOKEN_ROLE_GITBOOK } from "utils/constants"
import { setConfigTokenRole } from "./processor"
import { GuildIdNotFoundError, InternalError } from "errors"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription(
        "Set a role that user will get when they own specific amount of token"
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("role which you want to configure")
          .setRequired(true)
      )
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("amount of token required")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("address")
          .setDescription("token address")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("chain")
          .setDescription("chain name of the token")
          .setRequired(true)
      )
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId || !interaction.guild) {
      throw new GuildIdNotFoundError({})
    }
    const address = interaction.options.getString("address", true)
    const chain = interaction.options.getString("chain", true)
    const role = interaction.options.getRole("role", true)
    const amount = interaction.options.getNumber("amount", true)
    if (Number.isNaN(amount) || amount < 0 || amount >= Infinity) {
      throw new InternalError({
        msgOrInteraction: interaction,
        title: "Command Error",
        description: "The amount is invalid. Please insert a natural number.",
      })
    }

    return await setConfigTokenRole(
      interaction,
      interaction.user,
      role,
      interaction.guildId,
      address,
      chain,
      amount
    )
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}tokenrole set <role> <amount> <address> <chain_name>`,
        examples: `${PREFIX}tokenrole set @Mochi 1 0x4E15361FD6b4BB609Fa63C81A2be19d873717870 eth`,
        document: `${TOKEN_ROLE_GITBOOK}&action=set`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
