import Discord from "discord.js"
import events from "./events"
import { DISCORD_TOKEN } from "./env"
import { registerSlashCommands } from "./commands/slashCommand"
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

// register slash commands
registerSlashCommands()
// handle slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return

  const { commandName } = interaction

  if (commandName === "ping") {
    await interaction?.reply("Pong!")
  } else if (commandName === "server") {
    await interaction?.reply("Server info.")
  } else if (commandName === "user") {
    await interaction?.reply("User info.")
  }
})

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

export default client
