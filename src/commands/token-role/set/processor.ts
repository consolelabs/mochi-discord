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

export async function setConfigTokenRole(
  msg: Message | MessageComponentInteraction | CommandInteraction | undefined,
  originAuthor: User,
  role: Role | APIRole,
  guildId: string,
  address: string,
  chain: string,
  amount: number
) {
  const { ok, error } = await config.setConfigTokenRole({
    guild_id: guildId,
    role_id: role.id,
    address,
    chain,
    amount,
  })
  if (!ok) {
    handleError(msg, error)
  }
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: `Successfully set Token role to ${role.name}`,
          description:
            "You can run `$tokenrole set <role> <amount> <token_address> <chain_name>` to set a new token role.",
          originalMsgAuthor: originAuthor,
        }),
      ],
    },
  }
}

function handleError(
  msg: Message | MessageComponentInteraction | CommandInteraction | undefined,
  error: string | null
) {
  if (!msg) return
  let title = "Command Error"
  let description = ""
  if (!error) {
    throw new InternalError({
      message: msg,
      description,
    })
  }
  switch (true) {
    case error.toLowerCase().startsWith("invalid chain"):
      title = "Invalid Chain symbol"
      description =
        "We cannot find your chain symbol! Please enter a valid one!"
      break
    case error.toLowerCase().startsWith("token not found"):
      title = "Invalid Token address"
      description =
        "We cannot find your token address! Please enter a valid one!"
      break
    default:
      break
  }
  throw new InternalError({
    message: msg,
    title,
    description,
  })
}
