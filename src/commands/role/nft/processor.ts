import { ResponseListGuildGroupNFTRolesResponse } from "types/api"
import { getSlashCommand } from "utils/commands"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { HOMEPAGE_URL } from "utils/constants"

export async function list({ data }: ResponseListGuildGroupNFTRolesResponse) {
  if (data?.length === 0) {
    return {
      title: "No NFT roles found",
      description: `No NFT roles found! To set a new one, run ${await getSlashCommand(
        "role nft set"
      )}`,
    }
  }

  const description = data
    ?.sort((c1, c2) => (c1.number_of_tokens ?? 0) - (c2.number_of_tokens ?? 0))
    ?.map(
      (c) =>
        `<@&${c.role_id}> - requires \`${
          c.number_of_tokens
        }\` tokens\n${c.nft_collection_configs
          ?.map(
            (nftCol) =>
              `${getEmoji("BLANK")}${getEmoji("REPLY")}[\`${
                nftCol.symbol?.toUpperCase() ?? ""
              } ${shortenHashOrAddress(nftCol.address ?? "")}${
                nftCol.chain_name ? ` (${nftCol.chain_name.toUpperCase()})` : ""
              }\`](${nftCol.explorer_url || HOMEPAGE_URL})`
          )
          .join("\n")}`
    )
    .join("\n\n")

  return {
    title: "NFT role list",
    description: `Run ${await getSlashCommand(
      "role nft set"
    )} to add an NFT role.\n\n${description}`,
  }
}
