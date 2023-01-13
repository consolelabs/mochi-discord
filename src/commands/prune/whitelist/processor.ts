import config from "adapters/config"
import { Message, Role } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"

export async function createWhitelist(roleId: string, message: Message) {
  if (!message.guildId) {
    throw new GuildIdNotFoundError({ message })
  }
  const res = await config.createExcludedRole(roleId, message.guildId)
  if (!res.ok) {
    throw new APIError({ message, curl: res.curl, description: res.log })
  }
}

export async function whitelistRolesEmbed(roles: Role[]) {
  if (roles.length === 0) {
    return composeEmbedMessage(null, {
      title: `${getEmoji("TRANSACTIONS")} Prune Safelisted Roles`,
      description: `You haven't added any role to the safelist. Run \`$prune safelist @role\` to exclude a role when running \`$prune without\`.\n\n_Note: When pruning users in Server Settings, these roles are not protected!_ ${getEmoji(
        "NEKOSAD"
      )}`,
    })
  }

  let roleStr = ""
  roles.forEach((role) => {
    roleStr += `<@&${role.id}> `
  })

  return composeEmbedMessage(null, {
    title: `${getEmoji("TRANSACTIONS")} Prune Safelisted Roles`,
    description: `Roles are excluded when running \`${PREFIX}prune without\`: ${roleStr}\nRun \`${PREFIX}prune safelist @role\` to add role in safelist.\n\n_Note: When pruning users in Server Settings, these roles are not protected!_ ${getEmoji(
      "NEKOSAD"
    )}`,
  })
}
