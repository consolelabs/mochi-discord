import { getEmoji } from "utils/common"
import { KafkaQueueActivityDataCommand } from "types/common"
import kafka from "queue/kafka"
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
      return getEmoji("CASH")
    case "withdraw":
      return getEmoji("ANIMATED_COIN_3", true)
    case "deposit":
      return getEmoji("ANIMATED_MONEY", true)
    case "gain_xp":
      return getEmoji("ANIMATED_XP", true)
    case "gm":
      return getEmoji("ANIMATED_HEART", true)
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
    await kafka.queue?.produceActivityMsg(kafkaMessage)
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
