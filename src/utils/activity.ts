import { getEmoji } from "utils/common"
import { KafkaQueueActivityDataCommand } from "types/common"
import { kafkaQueue } from "queue/kafka/queue"
import { logger } from "../logger"

export function PlatformTypeToEmoji(platformType: string) {
  switch (platformType) {
    case "Mochi Pay":
      return getEmoji("MOCHI_PAY")
    case "Mochi App":
      return getEmoji("MOCHI_APP")
    default:
      return getEmoji("MOCHI_APP")
  }
}

export function ActionTypeToEmoji(actionType: string) {
  switch (actionType) {
    case "tip":
      return getEmoji("ACTIVITY_CASH")
    case "withdraw":
      return getEmoji("ACTIVITY_COIN")
    case "deposit":
      return getEmoji("ACTIVITY_MONEY")
    case "gain_xp":
      return getEmoji("ACTIVITY_XP")
    case "gm":
      return getEmoji("ACTIVITY_HEART")
    case "quest":
      return getEmoji("QUEST")
    default:
      return getEmoji("QUEST")
  }
}

export async function sendActivityMsg(
  kafkaMessage: KafkaQueueActivityDataCommand
) {
  try {
    await kafkaQueue?.produceActivityMsg([
      JSON.stringify(kafkaMessage, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      ),
    ])
  } catch (error) {
    logger.error("[KafkaQueue] - failed to enqueue")
  }
}

export function defaultActivityMsg(
  profileId: string,
  status: string,
  platform: string,
  action: string
): KafkaQueueActivityDataCommand {
  return {
    platform: "discord",
    activity: {
      profile_id: profileId,
      status,
      platform,
      action,
      content: {
        username: "",
        amount: "",
        token: "",
        server_name: "",
        number_of_user: "",
        role_name: "",
        channel_name: "",
        token_name: "",
        moniker_name: "",
        address: "",
      },
    },
  }
}
