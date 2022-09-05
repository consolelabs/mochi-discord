import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { SlashCommandBuilder } from "@discordjs/builders"
import { DISCORD_TOKEN, DISCORD_CLIENT_ID } from "../env"

export async function registerSlashCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Replies with pong!"),
    new SlashCommandBuilder()
      .setName("server")
      .setDescription("Replies with server info!"),
    new SlashCommandBuilder()
      .setName("user")
      .setDescription("Replies with user info!"),
  ].map((command) => command.toJSON())

  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN!)

  ;(async () => {
    try {
      await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID!), {
        body: commands,
      })
    } catch (error) {
      //   console.error(error)
    }
  })()
}
