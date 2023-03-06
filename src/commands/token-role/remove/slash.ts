import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import { list } from "../processor"
import { CommandInteraction, MessageSelectOptionData } from "discord.js"
import { APIError, GuildIdNotFoundError, InternalError } from "errors"
import { SlashCommand } from "types/common"
import { composeDiscordExitButton } from "ui/discord/button"
import { composeEmbedMessage2, getErrorEmbed } from "ui/discord/embed"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { PREFIX, SLASH_PREFIX, TOKEN_ROLE_GITBOOK } from "utils/constants"
import { handler } from "./processor"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a token role setup")
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId || !interaction.guild) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    const { ok, error, data, log, curl } = await config.getConfigTokenRoleList(
      interaction.guildId
    )
    if (!ok) {
      throw new APIError({
        msgOrInteraction: interaction,
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
              title: `No Token roles found`,
              description: `No Token roles found! To set a new one, run \`\`\`${PREFIX}tr set <role> <amount> <token_address> <chain_name>\`\`\``,
            }),
          ],
        },
      }
    }

    const options: MessageSelectOptionData[] = []
    for (const config of data) {
      if (!config.role_id) {
        throw new InternalError({
          msgOrInteraction: interaction,
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
            customId: "tokenrole_remove",
            placeholder: "Select a tokenrole",
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
        usage: `${SLASH_PREFIX}tokenrole remove`,
        examples: `${SLASH_PREFIX}tokenrole remove`,
        document: `${TOKEN_ROLE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
