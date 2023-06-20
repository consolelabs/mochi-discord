import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import Config from "adapters/config"
import { CommandInteraction, MessageSelectOptionData } from "discord.js"
import { SlashCommand } from "types/common"
import { NFT_ROLE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { handler } from "./processor"
import { list } from "../processor"
import { composeDiscordExitButton } from "ui/discord/button"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { getSlashCommand } from "utils/commands"
const command: SlashCommand = {
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a nft-role configuration")
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId || !interaction.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "This command must be run in a Guild",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }
    const configs = await Config.getGuildNFTRoleConfigs(interaction.guildId)
    if (!configs || !configs.ok) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: `${interaction.guild.name}'s nft roles`,
              description: `No configuration found! To set a new one, run ${await getSlashCommand(
                "role nft set"
              )}.`,
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    const options: MessageSelectOptionData[] = []
    configs.data.forEach((config) => {
      options.push({
        label: config.role_name ?? "",
        value: `${config.id ?? ""}|${config.role_name ?? ""}`,
      })
    })

    const embed = composeEmbedMessage(interaction, {
      title: "Select an option",
      description: (await list(configs)).description,
    })

    return {
      messageOptions: {
        embeds: [embed],
        components: [
          composeDiscordSelectionRow({
            customId: "nftrole_remove",
            placeholder: "Select a nftrole",
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
      composeEmbedMessage(interaction, {
        usage: `${SLASH_PREFIX}role nft remove`,
        examples: `${SLASH_PREFIX}role nft remove`,
        document: `${NFT_ROLE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
