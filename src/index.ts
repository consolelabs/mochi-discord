import Discord from "discord.js"
import events from "./events"
import { APPLICATION_ID, DISCORD_TOKEN } from "./env"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { logger } from "logger"

// slash commands
import help_slash from "./commands/help_slash"
import ticker_slash from "./commands/defi/ticker_slash"
import poe_slash from "./commands/config/poe_slash"
import { SlashCommand } from "types/common"

export const slashCommands: Record<string, SlashCommand> = {
  ticker: ticker_slash,
  help: help_slash,
  poe: poe_slash,
}

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.GUILD_INVITES,
  ],
  partials: ["MESSAGE", "REACTION", "CHANNEL"],
})

// discord client
client.login(DISCORD_TOKEN)
for (const e of events) {
  if (e.once) {
    client.once(e.name, e.execute as any)
  } else {
    client.on(e.name, e.execute as any)
  }
}

process.on("SIGTERM", () => {
  process.exit(0)
})

// register slash commands
const body = Object.values(slashCommands).map((c) => c.prepare(slashCommands))
const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN)

;(async () => {
  try {
    logger.info("Started refreshing application (/) commands.")
    await rest.put(Routes.applicationCommands(APPLICATION_ID), {
      body,
    })
    logger.info("Successfully reloaded application (/) commands.")
  } catch (error) {
    logger.error("Failed to refresh application (/) commands.")
  }
})()

export default client
