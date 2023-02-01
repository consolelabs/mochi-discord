import { ResponseListGuildXPRoles } from "types/api"

export function list({ data }: ResponseListGuildXPRoles) {
  if (data?.length === 0) {
    return {
      title: "No XP roles found",
      description: `You haven't set any XP roles yet. To set a new one, run \`$xprole set @<role> <xp_amount>\`. Then re-check your configuration using \`$xprole list\`.`,
    }
  }

  const description = data
    ?.sort((c1, c2) => (c1.required_xp ?? 0) - (c2.required_xp ?? 0))
    ?.map((c) => `<@&${c.role_id}> - requires \`${c.required_xp}\` xp`)
    .join("\n\n")

  return {
    title: "XP role list",
    description: `Run \`$xprole set <role> <xp_amount>\` to set the new XP role.\n\n${description}`,
  }
}
