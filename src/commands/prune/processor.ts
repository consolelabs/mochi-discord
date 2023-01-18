import config from "adapters/config"
import { Guild, Role } from "discord.js"
import { BotBaseError } from "errors"

export async function getExcludedRoles(guild: Guild): Promise<Role[]> {
  let roleIds: string[] = []
  const excludedRoles: Role[] = []
  const res = await config.getExcludedRole({ guild_id: guild.id })
  if (!res.ok) {
    throw new BotBaseError()
  }
  if (res.data) {
    roleIds = res.data.roles ?? []
  }

  roleIds.forEach(async (id) => {
    const role = await guild.roles.fetch(id)
    if (role) {
      excludedRoles.push(role)
    }
  })

  return excludedRoles
}
