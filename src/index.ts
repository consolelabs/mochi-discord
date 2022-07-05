import Discord from "discord.js"
import events from "./events"
import { DISCORD_TOKEN, LOG_CHANNEL_ID } from "./env"
import community from "adapters/community"
import { capFirst } from "utils/common"

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

client.on("ready", () => {
  const guild = client.guilds.cache.get(LOG_CHANNEL_ID)
  let commands
  if (guild) {
    commands = guild.commands
  } else {
    commands = client.application?.commands
  }

  commands?.create({
    name: "track",
    description: "Set a tracker for an NFT.",
    options: [
      {
        name: "type",
        description: "type",
        required: true,
        choices: [
          {
            name: "sales",
            value: "sales",
          },
        ],
        type: "STRING",
      },
      {
        name: "channel",
        description: "the channel",
        required: true,
        type: "CHANNEL",
      },
      {
        name: "collection-address",
        description: "address",
        required: true,
        type: "STRING",
      },
      {
        name: "chain",
        description: "platform",
        required: true,
        type: "STRING",
      },
    ],
  })
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return
  }
  const { commandName, options } = interaction

  if (commandName === "track") {
    const addr = options.getString("collection-address")
    const platform = options.getString("chain")
    const channelArg = options.getChannel("channel")
    ;(async () => {
      try {
        await community.createSalesTracker(
          addr,
          platform,
          LOG_CHANNEL_ID,
          channelArg.toString()
        )

        await interaction.deferReply({
          ephemeral: true,
        })

        await new Promise((resolve) => setTimeout(resolve, 5000))
        await interaction.editReply({
          content: `Successfully configure ${channelArg} as sales update channel. Tracked contract address ${addr} on platform ${capFirst(
            platform
          )}.`,
        })
      } catch (error) {
        await interaction.reply(
          "Something went wrong! Please try again or contact administrators"
        )
      }
    })()
  }
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

export default client
