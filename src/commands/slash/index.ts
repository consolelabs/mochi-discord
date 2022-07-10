import Discord from "discord.js"
import { Track, TrackInteraction } from "commands/community/track/slash"
import config from "adapters/config"

export async function setupSlashCommand(client: Discord.Client<boolean>) {
  client.on("ready", async () => {
    const getGuildsData = await config.getGuilds()
    getGuildsData.data.forEach((guildEle) => {
      const guild = client.guilds.cache.get(guildEle.id)
      let commands
      if (guild) {
        commands = guild.commands
      } else {
        commands = client.application?.commands
      }

      Track(commands)
    })
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
        TrackInteraction(interaction, options)
      }
    }
  )
}
