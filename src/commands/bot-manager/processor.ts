import { DOT } from "utils/constants"

type GuildConfigAdminRole = {
  id: number
  guild_id: string
  role_id: string
}

export function list(data: GuildConfigAdminRole[]) {
  if (data.length === 0) {
    return {
      title: "No admin roles found",
      description: `You haven't set any admin roles yet. \n\nTo set a new one, run \`/bot-manager set @<role>\`. \nThen re-check your configuration using \`/bot-manager info\`.`,
    }
  }
  const description = data
    ?.map((item) => `**${DOT} <@&${item.role_id}>**`)
    .join("\n")
  return {
    title: "Guild admin role list",
    description: `Run \`/bot-manager set <role>\` to add an admin role.\n\n${description}`,
  }
}
