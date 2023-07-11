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

export function ActionTypeToEmoji(actionType: number) {
  switch (actionType) {
    case 8: // deposit
      return getEmoji("ANIMATED_MONEY", true)
    case 9: // withdraw
      return getEmoji("ANIMATED_COIN_3", true)
    case 10 || 11 || 13: // send || recieve || earn
      return getEmoji("CASH")
    case 12: //swap
      return getEmoji("SWAP_ROUTE", true)
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
