import { ButtonInteraction, Collection, Guild, GuildMember } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage } from "discord/embed/ui"
import { getExcludedRoles } from "../processor"

export const CONFIRM_PRUNE_WITHOUT = "confirm_prune_without"

export async function pruneRoleExecute(
  i: ButtonInteraction,
  pruneList: Collection<string, GuildMember>,
  roleName: string
) {
  if (i.customId !== CONFIRM_PRUNE_WITHOUT) {
    return
  }
  if (!i.guild) throw new GuildIdNotFoundError({})

  const whitelistRole = await getExcludedRoles(i.guild)
  const whitelistIds: string[] = whitelistRole.map((r) => r.id)
  const invite = i.guild.invites.cache.first()

  const kicked = pruneList.map(async (mem) => {
    if (
      mem.roles.cache.hasAny(...whitelistIds) ||
      mem.permissions.has("ADMINISTRATOR")
    )
      return

    await mem
      .send({
        content: `Sorry to say this but you haven't had a role yet, so we have to remove you from ${i.guild?.name}\nYou are welcome to join again: ${invite?.url}`,
      })
      // handle user disable DM
      .catch(() => null)
    await mem.kick(`Missing role ${roleName}`)
  })

  const count = (await Promise.allSettled(kicked)).filter(
    (p) => p.status === "fulfilled"
  ).length

  i.reply({
    ephemeral: true,
    embeds: [
      composeEmbedMessage(null, {
        title: "Prune successful",
        description: `You have pruned ${count} members`,
      }),
    ],
  })
}

export async function getUsersWithoutRole(guild: Guild, roleId: string) {
  const members = await guild.members.fetch()
  const membersWithoutRole = members.filter((mem) => {
    return !mem.roles.cache.has(roleId) && !mem.user.bot
  })
  return membersWithoutRole
}
