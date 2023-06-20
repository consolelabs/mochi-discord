import { ResponseGetLevelRoleConfigsResponse } from "types/api"
import { getSlashCommand } from "utils/commands"
import { getEmoji } from "utils/common"

export async function list({ data }: ResponseGetLevelRoleConfigsResponse) {
  if (data?.length === 0) {
    return {
      title: "No level roles found",
      description: `You haven't set any roles for this level yet. \n\nTo set a new one, run ${await getSlashCommand(
        "role level set"
      )}. \nThen re-check your configuration using ${await getSlashCommand(
        "role level list"
      )}.`,
    }
  }
  const description = data
    ?.map(
      (item) =>
        `**Level ${item.level}** - requires \`${
          item.level_config?.min_xp
        }\` XP\n${getEmoji("BLANK")}${getEmoji("REPLY")} <@&${item.role_id}>`
    )
    .join("\n")
  return {
    title: "Level role list",
    description: `Run ${await getSlashCommand(
      "role level set"
    )} to add a level role.\n\n${description}`,
  }
}
