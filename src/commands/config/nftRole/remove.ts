import Config from "adapters/config"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import {
  composeDiscordSelectionRow,
  composeDiscordExitButton,
  composeEmbedMessage,
  getErrorEmbed
} from "utils/discordEmbed"
import {
  Message,
  MessageSelectOptionData,
  SelectMenuInteraction
} from "discord.js"
import { msgColors } from "../../../utils/common"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  await Config.removeGuildNFTRoleConfig(interaction.values[0])

  return {
    messageOptions: {
      content: "** **",
      embeds: [
        {
          description: `Remove NFT role configuration successfully!`,
          color: msgColors.PRIMARY
        }
      ],
      components: []
    },
    commandChoiceOptions: {}
  }
}

const command: Command = {
  id: "nr_remove",
  command: "remove",
  brief: "Remove a nft-role configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async function(msg) {
    const configs: any[] = await Config.getGuildNFTRoleConfigs(msg.guildId)
    if (!configs || !configs.length) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: `${msg.guild.name}'s nftroles configuration`,
              description: "No configuration found!"
            })
          ]
        }
      }
    }

    const options: MessageSelectOptionData[] = []
    configs.forEach(config => {
      options.push({
        label: config.role_name,
        value: config.id,
        description: `${config.number_of_tokens} ${
          config.nft_collection.symbol
        } ${config.token_id ? "`No." + config.token_id + "`" : ""}`
      })
    })

    return {
      messageOptions: {
        content: "Which nftrole configuration do you want to remove?",
        components: [
          composeDiscordSelectionRow({
            customId: "nftrole_remove",
            placeholder: "Select a nftrole",
            options
          }),
          composeDiscordExitButton()
        ]
      },
      commandChoiceOptions: {
        userId: msg.author.id,
        guildId: msg.guildId,
        channelId: msg.channelId,
        handler,
      }
    }
  },
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nr remove`,
        examples: `${PREFIX}nr remove`
      })
    ]
  }),
  canRunWithoutAction: true,
  aliases: ["rm"]
}

export default command
