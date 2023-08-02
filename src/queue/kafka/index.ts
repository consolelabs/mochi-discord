import { CommandInteraction, Message } from "discord.js"
import {
  KAFKA_BROKERS,
  KAFKA_CLIENT_ID,
  KAFKA_TOPIC,
  KAFKA_ACTIVITY_PROFILE_TOPIC,
  KAFKA_NOTIFICATION_TOPIC,
  KAFKA_ANALYTIC_TOPIC,
  KAFKA_AUDIT_TOPIC,
} from "env"
import { Kafka, Partitioners, Producer } from "kafkajs"
import { getAuthor } from "../../utils/common"

export default class Queue {
  private producer: Producer
  private kafka: Kafka
  private topic = KAFKA_TOPIC
  private analyticTopic = KAFKA_ANALYTIC_TOPIC
  private activityProfileTopic = KAFKA_ACTIVITY_PROFILE_TOPIC
  private notificationTopic = KAFKA_NOTIFICATION_TOPIC
  private auditTopic = KAFKA_AUDIT_TOPIC

  constructor() {
    this.kafka = new Kafka({
      brokers: KAFKA_BROKERS.split(","),
      clientId: KAFKA_CLIENT_ID,
    })

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: true,
    })
  }

  async connect() {
    await this.producer.connect()
  }

  async disconnect() {
    await this.producer.disconnect()
  }

  async produceAnalyticMsg(messages: any[]) {
    await this.producer.send({
      topic: this.analyticTopic,
      messages: messages.map((m) => ({
        value: JSON.stringify({ event_type: "system_error", payload: m }),
      })),
    })
  }

  async produceBatch(messages: string[]) {
    // check if message is json
    for (const message of messages) {
      try {
        JSON.parse(message)
      } catch (e) {
        throw new Error("Message is not a valid json")
      }
    }

    await this.producer.send({
      topic: this.topic,
      messages: messages.map((m) => ({ value: m })),
    })
  }

  async produceActivityMsg(messages: string[]) {
    // check if message is json
    for (const message of messages) {
      try {
        JSON.parse(message)
      } catch (e) {
        throw new Error("Message is not a valid json")
      }
    }

    await this.producer.send({
      topic: this.activityProfileTopic,
      messages: messages.map((m) => ({ value: m })),
    })
  }

  async produceNotificationMsg(messages: string[]) {
    // check if message is json
    for (const message of messages) {
      try {
        JSON.parse(message)
      } catch (e) {
        throw new Error("Message is not a valid json")
      }
    }

    await this.producer.send({
      topic: this.notificationTopic,
      messages: messages.map((m) => ({ value: m })),
    })
  }

  async produceAuditMsg(msgOrInteraction: Message | CommandInteraction) {
    const author = getAuthor(msgOrInteraction)
    const payload = {
      type: 4,
      discord_log: {
        message: {
          message_id: msgOrInteraction.id,
          author: {
            id: author.id,
            is_bot: author.bot,
            username: author.username,
          },
          channel: {
            id: msgOrInteraction.channelId,
            type: msgOrInteraction.channel?.type ?? "",
          },
          date: msgOrInteraction.createdTimestamp,
          text: "",
        },
      },
    }
    const data = JSON.stringify(payload)
    const bytes = new TextEncoder().encode(data)
    const bStr = Array.from(bytes, (x) => String.fromCodePoint(x)).join("")

    await this.producer.send({
      topic: this.auditTopic,
      messages: [
        {
          value: JSON.stringify({
            type: "audit",
            sender: "mochi-discord",
            message: btoa(bStr),
          }),
        },
      ],
    })
  }
}
