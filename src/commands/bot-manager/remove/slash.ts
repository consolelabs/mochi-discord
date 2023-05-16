import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import CacheManager from "cache/node-cache"
import { list } from "commands/bot-manager/processor"
import {
  CommandInteraction,
  Message,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { InteractionHandler } from "handlers/discord/select-menu"
import { SlashCommand } from "types/common"
import { composeDiscordExitButton } from "ui/discord/button"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { SLASH_PREFIX } from "utils/constants"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove guild admin role")
  },
  run: async function (interaction) {
    if (!interaction.guildId || !interaction.guild) {
      throw new GuildIdNotFoundError({})
    }

    const { ok, data } = await config.getGuildAdminRoles({
      guildId: interaction.guildId,
    })
    if (!ok) {
      throw new InternalError({
        msgOrInteraction: interaction,
        title: "Failed to remove guild admin role",
        description: "Please try again later.",
      })
    }

    if (data.length === 0) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: `No admin roles found`,
              description: `No admin roles found! To set a new one, run \`\`\`${SLASH_PREFIX}bot-manager set <role>\`\`\``,
            }),
          ],
        },
      }
    }

    const options: MessageSelectOptionData[] = []
    for (const config of data as any) {
      const role = await interaction.guild.roles.fetch(config.role_id)
      options.push({
        label: role?.name ?? "NA",
        value: `${config.id ?? ""}|${role?.name ?? ""}`,
      })
    }

    const embed = composeEmbedMessage2(interaction, {
      title: "Select an option",
      description: list(data as any).description,
    })

    return {
      messageOptions: {
        embeds: [embed],
        components: [
          composeDiscordSelectionRow({
            customId: "botmanager_remove",
            placeholder: "Select a role to remove",
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
        usage: `${SLASH_PREFIX}bot-manager remove <role>`,
        examples: `${SLASH_PREFIX}bot-manager remove @role`,
      }),
    ],
  }),
  colorType: "Server",
}

const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const msg = msgOrInteraction as Message
  const [configId, name] = interaction.values[0].split("|")
  await config.removeGuildAdminRole(configId)
  CacheManager.findAndRemove("bot-manager", `guild-${interaction.guildId}`)
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          msg,
          title: `Successfully removed ${name}!`,
          description: `You can set the new role by using \`/bot-manager set <role>\``,
        }),
      ],
      components: [],
    },
  }
}

export default command
