import Config from "adapters/config"
import { Command } from "types/common"
import { NFT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import {
  composeDiscordSelectionRow,
  composeDiscordExitButton,
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import {
  Message,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { list } from "./list"
import { InteractionHandler } from "utils/InteractionManager"

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
            description: `To set a new nft role, run \`$nr set <role> <amount> <nft_address1,nft_address2> \`.\n\n${description}`,
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

const command: Command = {
  id: "nr_remove",
  command: "remove",
  brief: "Remove a nft-role configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const configs = await Config.getGuildNFTRoleConfigs(msg.guildId)
    if (!configs || !configs.ok) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: `${msg.guild.name}'s nft roles`,
              description:
                "No configuration found! To set a new one, run `$lr <role> <level>`.",
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

    const embed = composeEmbedMessage(msg, {
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
          composeDiscordExitButton(msg.author.id),
        ],
      },
      interactionOptions: {
        handler,
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nr remove`,
        examples: `${PREFIX}nr remove`,
        document: NFT_ROLE_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
