import Discord from "discord.js"
import { LOG_CHANNEL_ID } from "env"
import community from "adapters/community"
import { capFirst } from "utils/common"

export async function slashTrack(client: Discord.Client<boolean>) {
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
    }
  )
}
