import { ModelToken, ResponseListGuildTokenRoles } from "types/api"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { HOMEPAGE_URL } from "utils/constants"

export function list({ data }: ResponseListGuildTokenRoles) {
  if (data?.length === 0) {
    return {
      title: "Token role list",
      description: `No configuration was found! You can run \`$tokenrole set\` to set the new token role. `,
    }
  }

  const tokenDescription = (token?: ModelToken) => {
    return `${getEmoji("blank")}${getEmoji("reply")}[\`${
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

  return {
    title: "Token role list",
    description: `You can run \`$tokenrole set\` to set the new role.\n\n${description}`,
  }
}
