import Config from "adapters/config"
import { APIError, GuildIdNotFoundError } from "errors"
import { ResponseListGuildGroupNFTRolesResponse } from "types/api"
import { Command } from "types/common"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { NFT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

export function list({ data }: ResponseListGuildGroupNFTRolesResponse) {
  let description
  if (data?.length === 0) {
    description = `No nft roles found! To set a new one, run \`\`\`${PREFIX}nr set <role> <amount> <nft_address1,nft_address2>\`\`\``
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
                  nftCol.chain_name
                    ? ` (${nftCol.chain_name.toUpperCase()})`
                    : ""
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
      throw new GuildIdNotFoundError({ message: msg })
    }
    const res = await Config.getGuildNFTRoleConfigs(msg.guildId)
    if (!res.ok) {
      throw new APIError({
        message: msg,
        curl: res.curl,
        description: res.log,
      })
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: [`${msg.guild.name}'s nft roles`, msg.guild.iconURL()],
            description: list(res),
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
        document: `${NFT_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
