import { EmbedFieldData } from "discord.js"
import {
  ModelMixRoleNFTRequirement,
  ModelMixRoleTokenRequirement,
  ResponseListGuildMixRoles,
} from "types/api"
import { getEmoji } from "utils/common"

export function list({ data }: ResponseListGuildMixRoles) {
  if (data?.length === 0) {
    return {
      title: "No mix roles found",
      description: `You haven't set any mix roles yet. To set a new one, run \`$mixrole set\`. Then re-check your configuration using \`$mixrole list\`.`,
      fields: [],
    }
  }

  const formatedNFT = (
    nft_requirement: ModelMixRoleNFTRequirement | undefined
  ) => {
    const req = nft_requirement
      ? `${nft_requirement.required_amount} ${
          nft_requirement.nft_collection?.symbol ?? "NA"
        }`
      : "0"
    return `\`${req}\``
  }

  const formatedToken = (
    token_requirement: ModelMixRoleTokenRequirement | undefined
  ) => {
    const req = token_requirement
      ? `${token_requirement.required_amount} ${
          token_requirement.token?.symbol ?? "NA"
        }`
      : "0"
    return `\`${req}\``
  }

  const { role, level, nftnToken } = (data ?? []).reduce(
    (acc, cur) => ({
      role: `${acc.role}\n<@&${cur.role_id}>`,
      level: `${acc.level}\n\`${cur.required_level}\``,
      nftnToken: `${acc.nftnToken}\n${formatedNFT(
        cur.nft_requirement
      )} ${formatedToken(cur.token_requirement)}`,
    }),
    { role: "", level: "", nftnToken: "" }
  )

  const fields: EmbedFieldData[] = [
    { name: "Role", value: role, inline: true },
    { name: "Level", value: level, inline: true },
    { name: "NFT/Token", value: nftnToken, inline: true },
  ]

  return {
    title: `${getEmoji("star2")} Mixed role list`,
    description: `You can run \`$mixrole set\` to set the new combined role.\n\n`,
    fields: fields,
  }
}
