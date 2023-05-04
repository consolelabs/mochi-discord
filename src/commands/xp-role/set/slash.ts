import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX, XP_ROLE_GITBOOK } from "utils/constants"
import { isInvalidAmount, setConfigXPRole } from "./processor"
import { GuildIdNotFoundError, InternalError } from "errors"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription(
        "Set a role that user will get when they own specific amount of xp"
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("role which you want to configure")
          .setRequired(true)
      )
      .addIntegerOption((option) =>
        option
          .setName("amount")
          .setDescription("amount of xp required")
          .setRequired(true)
      )
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId || !interaction.guild) {
      throw new GuildIdNotFoundError({})
    }
    const role = interaction.options.getRole("role", true)
    const amount = interaction.options.getNumber("amount", true)
    if (isInvalidAmount(amount)) {
      throw new InternalError({
        msgOrInteraction: interaction,
        title: "Command Error",
        description: "The amount is invalid. Please insert a natural number.",
      })
    }

    return await setConfigXPRole(
      interaction,
      interaction.user,
      role,
      interaction.guildId,
      amount
    )
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}xprole set <role> <amount>`,
        examples: `${SLASH_PREFIX}xprole set @Mochi 1`,
        document: `${XP_ROLE_GITBOOK}&action=set`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
