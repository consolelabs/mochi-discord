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

    let roles = ""
    let amountToken = ""

    configs.forEach((config) => {
      roles += `<@&${config.role_id}>\n`
      amountToken += `${config.number_of_tokens} ${
        config.nft_collection.symbol
      } ${config.token_id ? "`No." + config.token_id + "`" : ""} \n`
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: [
              `${msg.guild.name}'s nftroles configuration`,
              msg.guild.iconURL(),
            ],
          }).addFields([
            {
              name: "NFT Roles",
              value: roles,
              inline: true,
            },
            {
              name: "Amount of tokens",
              value: amountToken,
              inline: true,
            },
          ]),
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
