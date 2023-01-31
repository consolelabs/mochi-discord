import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import { list } from "../processor"
import { CommandInteraction, MessageSelectOptionData } from "discord.js"
import { APIError, GuildIdNotFoundError, InternalError } from "errors"
import { SlashCommand } from "types/common"
import { composeDiscordExitButton } from "ui/discord/button"
import { composeEmbedMessage2, getErrorEmbed } from "ui/discord/embed"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { PREFIX, SLASH_PREFIX, XP_ROLE_GITBOOK } from "utils/constants"
import { handler } from "./processor"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a xp role setup")
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId || !interaction.guild) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    const { ok, error, data, log, curl } = await config.getConfigXPRoleList(
      interaction.guildId
    )
    if (!ok) {
      throw new APIError({
        message: interaction,
        description: log,
        curl,
        error,
      })
    }
    if (data.length === 0) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: `No XP roles found`,
              description: `No XP roles found! To set a new one, run \`\`\`${PREFIX}xr set <role> <amount>\`\`\``,
            }),
          ],
        },
      }
    }

    const options: MessageSelectOptionData[] = []
    for (const config of data) {
      if (!config.role_id) {
        throw new InternalError({
          message: interaction,
          description: "invalid role id",
        })
      }
      const role = await interaction.guild?.roles.fetch(config.role_id)
      options.push({
        label: role?.name ?? "NA",
        value: `${config.id ?? ""}|${role?.name ?? ""}`,
      })
    }

    const embed = composeEmbedMessage2(interaction, {
      title: "Select an option",
      description: list({ data }).description,
    })

    return {
      messageOptions: {
        embeds: [embed],
        components: [
          composeDiscordSelectionRow({
            customId: "xprole_remove",
            placeholder: "Select a xprole",
            options,
          }),
          composeDiscordExitButton(interaction.user.id),
        ],
      },
      interactionOptions: {
        handler,
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}xprole remove`,
        examples: `${SLASH_PREFIX}xprole remove`,
        document: `${XP_ROLE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
