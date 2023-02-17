import config from "adapters/config"
import { APIRole } from "discord-api-types/v9"
import {
  Message,
  MessageComponentInteraction,
  CommandInteraction,
  User,
  Role,
} from "discord.js"
import { InternalError } from "errors"
import { getSuccessEmbed } from "ui/discord/embed"
import { getEmoji } from "utils/common"

export async function setConfigXPRole(
  msg: Message | MessageComponentInteraction | CommandInteraction | undefined,
  originAuthor: User,
  role: Role | APIRole,
  guildId: string,
  xp: number
) {
  const { ok, error } = await config.setConfigXPRole({
    guild_id: guildId,
    role_id: role.id,
    xp,
  })
  if (!ok) {
    handleError(msg, error)
  }
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: `Successfully set`,
          description: `When users earn ${xp} xp, they will get <@&${role.id}>`,
          originalMsgAuthor: originAuthor,
        }),
      ],
    },
  }
}

export function isInvalidAmount(amount: number): boolean {
  return (
    Number.isNaN(amount) ||
    !Number.isInteger(amount) ||
    amount < 0 ||
    amount >= Infinity
  )
}

function handleError(
  msg: Message | MessageComponentInteraction | CommandInteraction | undefined,
  error: string
) {
  if (!msg) return
  let title = "Command Error"
  let description = ""
  if (error.toLowerCase().startsWith("XP role config already existed")) {
    title = "Invalid Role"
    description = `
      Your role has been used for an existing NFT role. Please choose another one.
      ${getEmoji("POINTINGRIGHT")} Type @ to see a role list.
      ${getEmoji(
        "POINTINGRIGHT"
      )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.
      `
  }
  throw new InternalError({
    message: msg,
    title,
    description,
  })
}
