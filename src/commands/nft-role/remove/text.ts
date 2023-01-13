import Config from "adapters/config"
import { MessageSelectOptionData } from "discord.js"
import { list } from "commands/nft-role/processor"
import { Command } from "types/common"
import { NFT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "discord/embed/ui"
import { handler } from "./processor"
import { composeDiscordExitButton } from "discord/button/ui"
import { composeDiscordSelectionRow } from "discord/select-menu/ui"

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
              title: `No NFT roles found`,
              description: `No NFT roles found! To set a new one, run \`\`\`${PREFIX}nr set <role> <amount> <nft_address1,nft_address2>\`\`\``,
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

    const { description } = list(configs)
    const embed = composeEmbedMessage(msg, {
      title: "Select an option",
      description,
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
        document: `${NFT_ROLE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
