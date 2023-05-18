import { getSlashCommand } from "utils/commands"
import { getEmoji } from "utils/common"
import { DOT } from "utils/constants"

type GuildConfigAdminRole = {
  id: number
  guild_id: string
  role_id: string
}

export async function list(data: GuildConfigAdminRole[]) {
  if (data.length === 0) {
    return {
      title: "No admin roles found",
      description: `You haven't set any bot managers role yet. \n\nTo set a new one, run </bot-manager set:${await getSlashCommand(
        "bot-manager set"
      )}>. \nThen re-check your configuration using </bot-manager info:${await getSlashCommand(
        "bot-manager info"
      )}>.`,
    }
  }
  const description = data
    ?.map((item) => `**${DOT} <@&${item.role_id}>**`)
    .join("\n")
  return {
    title: "List of bot managers",
    description: `${description}\n\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} You can add bot managers role by using </bot-manager set:${await getSlashCommand(
      "bot-manager set"
    )}>\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} The bot managers can use all the server management feature, even when they don't have an admin role.`,
  }
}
