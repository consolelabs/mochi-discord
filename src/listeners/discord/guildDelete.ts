import { logger } from "logger"
import { DiscordEvent } from "."
import { kafkaQueue } from "queue/kafka/queue"

const event: DiscordEvent<"guildDelete"> = {
  name: "guildDelete",
  once: false,
  execute: async (guild) => {
    logger.info(`Left guild: ${guild.name} (id: ${guild.id}).`)

    await kafkaQueue?.produceAuditEvent(guild, "left")
  },
}

export default event
