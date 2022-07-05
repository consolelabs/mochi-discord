import Discord from "discord.js"
import { LOG_CHANNEL_ID } from "env"
import {
  slashTrack,
  slashTrackInteraction,
} from "commands/community/track/slash"

export async function slash(client: Discord.Client<boolean>) {
  client.on("ready", () => {
    const guild = client.guilds.cache.get(LOG_CHANNEL_ID)
    let commands
    if (guild) {
      commands = guild.commands
    } else {
      commands = client.application?.commands
    }

    slashTrack(commands)
  })

  client.on(
    "interactionCreate",
    async (interaction: {
      isCommand?: any
      deferReply?: any
      editReply?: any
      reply?: any
      commandName?: any
      options?: any
    }) => {
      if (!interaction.isCommand()) {
        return
      }
      const { commandName, options } = interaction

      if (commandName === "track") {
        slashTrackInteraction(interaction, options)
      }
    }
  )
}
