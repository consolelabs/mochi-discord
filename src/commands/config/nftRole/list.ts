import Config from "adapters/config"
import { ResponseListGuildGroupNFTRolesResponse } from "types/api"
import { Command } from "types/common"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { NFT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

export function list({ data }: ResponseListGuildGroupNFTRolesResponse) {
  let description
  if (data?.length === 0) {
    description = "No configuration found"
  } else {
    description = data
      ?.sort(
        (c1, c2) => (c1.number_of_tokens ?? 0) - (c2.number_of_tokens ?? 0)
      )
      ?.map(
        (c) =>
          `<@&${c.role_id}> - requires \`${
            c.number_of_tokens
          }\` tokens\n${c.nft_collection_configs
            ?.map(
              (nftCol) =>
                `${getEmoji("blank")}${getEmoji("reply")}[\`${
                  nftCol.symbol?.toUpperCase() ?? ""
                } ${shortenHashOrAddress(nftCol.address ?? "")}${
                  nftCol.chain_id ? ` (${nftCol.chain_id})` : ""
                }\`](${nftCol.explorer_url || "https://getmochi.co/"})`
            )
            .join("\n")}`
      )
      .join("\n\n")
  }
  return description
}

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

    const description = list(configs)

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
        document: NFT_ROLE_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
