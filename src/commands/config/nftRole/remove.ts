import Config from "adapters/config"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
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
import { CommandChoiceHandler } from "utils/CommandChoiceManager"

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const msg = msgOrInteraction as Message
  await Config.removeGuildNFTRoleConfig(interaction.values[0])
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          msg,
          description: "Remove NFT role configuration successfully!",
        }),
      ],
      components: [],
    },
    commandChoiceOptions: {},
  }
}

const command: Command = {
  id: "nr_remove",
  command: "remove",
  brief: "Remove a nft-role configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    const configs: any[] = await Config.getGuildNFTRoleConfigs(msg.guildId)
    if (!configs || !configs.length) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: `${msg.guild.name}'s nftroles configuration`,
              description: "No configuration found!",
            }),
          ],
        },
      }
    }

    const options: MessageSelectOptionData[] = []
    configs.forEach((config) => {
      options.push({
        label: config.role_name,
        value: config.id,
        description: `${config.number_of_tokens} ${
          config.nft_collection.symbol
        } ${config.token_id ? "`No." + config.token_id + "`" : ""}`,
      })
    })

    const embed = composeEmbedMessage(msg, {
      title: "Select an option",
      description: "Which nftrole configuration do you want to remove?",
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
      commandChoiceOptions: {
        userId: msg.author.id,
        guildId: msg.guildId,
        channelId: msg.channelId,
        handler,
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nr remove`,
        examples: `${PREFIX}nr remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["rm"],
  colorType: "Server",
}

export default command
