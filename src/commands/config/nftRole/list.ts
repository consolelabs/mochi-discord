import Config from "adapters/config"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

const command: Command = {
  id: "nr_list",
  command: "list",
  brief: "Get server's nftroles configuration",
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
              title: `${msg.guild.name}'s nftroles configuration`,
              description: "No configuration found!",
            }),
          ],
        },
      }
    }

    const description = configs.data
      .map(
        (c) =>
          `**${c.nft_collection?.symbol} amount ${c.number_of_tokens}** - <@&${c.role_id}>`
      )
      .join("\n")

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: [
              `${msg.guild.name}'s nftroles configuration`,
              msg.guild.iconURL(),
            ],
            description,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nr list`,
        examples: `${PREFIX}nr list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
