import Config from "adapters/config"
import { SlashCommand } from "types/common"
import { NFT_ROLE_GITBOOK, SLASH_PREFIX as PREFIX } from "utils/constants"
import {
  composeDiscordSelectionRow,
  composeDiscordExitButton,
  getErrorEmbed,
  getSuccessEmbed,
  composeEmbedMessage2,
} from "utils/discordEmbed"
import {
  CommandInteraction,
  Message,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { list } from "./list"
import { InteractionHandler } from "utils/InteractionManager"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const msg = msgOrInteraction as Message
  const [groupId, name] = interaction.values[0].split("|")
  await Config.removeGuildNFTRoleGroupConfig(groupId)
  const configs = await Config.getGuildNFTRoleConfigs(
    msgOrInteraction.guildId ?? ""
  )
  if (configs.ok) {
    const description = list(configs)
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: `Successfully removed ${name}!`,
            description: `To set a new nft role, run \`${PREFIX}nftrole set <role> <amount> <nft_address1,nft_address2> \`.\n\n${description}`,
          }),
        ],
        components: [],
      },
    }
  }
  return {
    messageOptions: { embeds: [getErrorEmbed({})] },
  }
}

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
              description:
                "No configuration found! To set a new one, run `$lr <role> <level>`.",
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

    const embed = composeEmbedMessage2(interaction, {
      title: "Select an option",
      description: list(configs),
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
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}nftrole remove`,
        examples: `${PREFIX}nftrole remove`,
        document: `${NFT_ROLE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
