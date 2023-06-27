import { ModelToken, ResponseListGuildTokenRoles } from "types/api"
import { getSlashCommand } from "utils/commands"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { HOMEPAGE_URL } from "utils/constants"

export async function list({ data, meta }: ResponseListGuildTokenRoles) {
  if (data?.length === 0) {
    return {
      title: "Token role list",
      description: `No configuration was found! You can run ${await getSlashCommand(
        "role token set"
      )} to set the new token role. `,
    }
  }

  const tokenDescription = (token?: ModelToken) => {
    return `${getEmoji("BLANK")}${getEmoji("REPLY")}[\`${
      token?.symbol?.toUpperCase() ?? ""
    } ${shortenHashOrAddress(token?.address ?? "")}${
      token?.chain?.short_name
        ? ` (${token.chain.short_name.toUpperCase()})`
        : ""
    }\`](${HOMEPAGE_URL})`
  }

  const description = data
    ?.sort((c1, c2) => (c1.required_amount ?? 0) - (c2.required_amount ?? 0))
    ?.map(
      (c) =>
        `<@&${c.role_id}> - requires \`${
          c.required_amount
        }\` tokens\n${tokenDescription(c.token)}`
    )
    .join("\n\n")

  const metaDescription = meta?.next_sync
    ? `\n\nJust a heads up, members' roles will be updated in ${meta.next_sync} minutes.`
    : ""

  return {
    title: "Token role list",
    description: `You can run ${await getSlashCommand(
      "role token set"
    )} to set the new role.\n\n${description}${metaDescription}`,
  }
}
