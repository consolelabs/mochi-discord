import config from "adapters/config"
import { APIRole } from "discord-api-types/v9"
import {
  Message,
  MessageComponentInteraction,
  CommandInteraction,
  User,
  Role,
} from "discord.js"
import { InternalError, APIError } from "errors"
import { getSuccessEmbed } from "ui/discord/embed"
import profile from "adapters/profile"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_TOKENROLE,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { sendActivityMsg, defaultActivityMsg } from "utils/activity"
import { getSlashCommand } from "utils/commands"

export async function setConfigTokenRole(
  msg: Message | MessageComponentInteraction | CommandInteraction | undefined,
  originAuthor: User,
  role: Role | APIRole,
  guildId: string,
  address: string,
  chain: string,
  amount: number,
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

  // send activity
  const dataProfile = await profile.getByDiscord(originAuthor.id)
  if (dataProfile.err) {
    throw new APIError({
      msgOrInteraction: msg,
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
      status: dataProfile.status ?? 500,
      error: dataProfile.Error,
    })
  }

  const kafkaMsg: KafkaQueueActivityDataCommand = defaultActivityMsg(
    dataProfile.id,
    MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
    MOCHI_APP_SERVICE,
    MOCHI_ACTION_TOKENROLE,
  )
  kafkaMsg.activity.content.role_name = role.name
  sendActivityMsg(kafkaMsg)

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: `Successfully set Token role to ${role.name}`,
          description: `You can run ${await getSlashCommand(
            "role token set",
          )} to set a new token role.`,
          originalMsgAuthor: originAuthor,
        }),
      ],
    },
  }
}

function handleError(
  msg: Message | MessageComponentInteraction | CommandInteraction | undefined,
  error: string | null,
) {
  if (!msg) return
  let title = "Command Error"
  let description = ""
  if (!error) {
    throw new InternalError({
      msgOrInteraction: msg,
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
    msgOrInteraction: msg,
    title,
    description,
  })
}
