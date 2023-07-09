import {
  KAFKA_BROKERS,
  KAFKA_CLIENT_ID,
  KAFKA_TOPIC,
  KAFKA_ACTIVITY_PROFILE_TOPIC,
  KAFKA_NOTIFICATION_TOPIC,
  KAFKA_ANALYTIC_TOPIC,
} from "env"
import { Kafka, Partitioners, Producer } from "kafkajs"
import { logger } from "logger"

export default {
  queue: null,
  init: function () {
    this.queue = new Queue()
  },
} as { queue: Queue | null; init: () => void }

class Queue {
  private producer: Producer
  private kafka: Kafka
  private topic = KAFKA_TOPIC
  private analyticTopic = KAFKA_ANALYTIC_TOPIC
  private activityProfileTopic = KAFKA_ACTIVITY_PROFILE_TOPIC
  private notificationTopic = KAFKA_NOTIFICATION_TOPIC

  constructor() {
    this.kafka = new Kafka({
      brokers: KAFKA_BROKERS.split(","),
      clientId: KAFKA_CLIENT_ID,
      retry: {
        retries: 3,
      },
      logCreator: (logLevel) => {
        return function ({ log }) {
          const { message } = log
          logger[logLevel]?.(message)
        }
      },
    })

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: true,
    })

    this.connect()
  }

  async connect() {
    try {
      logger.info("Connecting to Kafka...")
      await this.producer.connect()
      logger.info("Connect to Kafka OK")
    } catch (e: any) {
      logger.error(e)
      logger.warn("Connect to Kafka FAIL")
    }
  }

  async disconnect() {
    try {
      logger.info("Disconnecting from Kafka...")
      await this.producer.disconnect()
      logger.info("Disconnect from Kafka OK")
    } catch (e: any) {
      logger.error(e)
      logger.warn("Disconnect from Kafka FAIL")
    }
  }

  private stringify(messages: any[]) {
    try {
      return messages.map((msg) =>
        JSON.stringify(msg, (_, v) =>
          typeof v === "bigint" ? v.toString() : v
        )
      )
    } catch (_) {
      throw new Error("Message is not valid json")
    }
  }

  // don't use stringify logic in this method
  async produceAnalyticMsg(messages: any[]) {
    await this.producer.send({
      topic: this.analyticTopic,
      messages: messages.map((m) => ({
        value: JSON.stringify({ event_type: "system_error", payload: m }),
      })),
    })
  }

  async produceBatch(messages: any) {
    const stringified = this.stringify(
      Array.isArray(messages) ? messages : [messages]
    )

    await this.producer.send({
      topic: this.topic,
      messages: stringified.map((m) => ({ value: m })),
    })
  }

  async produceActivityMsg(messages: any) {
    const stringified = this.stringify(
      Array.isArray(messages) ? messages : [messages]
    )

    await this.producer.send({
      topic: this.activityProfileTopic,
      messages: stringified.map((m) => ({ value: m })),
    })
  }

  async produceNotificationMsg(messages: any) {
    const stringified = this.stringify(
      Array.isArray(messages) ? messages : [messages]
    )

    await this.producer.send({
      topic: this.notificationTopic,
      messages: stringified.map((m) => ({ value: m })),
    })
  }
}
