import {
  KafkaNotificationMessage,
  KafkaNotificationPayRequestMessage,
} from "types/common"
import { kafkaQueue } from "queue/kafka/queue"
import { logger } from "../logger"

export async function sendNotificationMsg(
  kafkaMessage: KafkaNotificationMessage
) {
  try {
    await kafkaQueue?.produceNotificationMsg([
      JSON.stringify(kafkaMessage, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      ),
    ])
  } catch (error) {
    logger.error("[KafkaQueue] - failed to enqueue")
  }
}

export async function sendNotificationPayRequestMsg(
  kafkaMessage: KafkaNotificationPayRequestMessage
) {
  try {
    await kafkaQueue?.produceNotificationMsg([
      JSON.stringify(kafkaMessage, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      ),
    ])
  } catch (error) {
    logger.error("[KafkaQueue] - failed to enqueue")
  }
}
