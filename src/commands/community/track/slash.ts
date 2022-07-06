import community from "adapters/community"
import { capFirst } from "utils/common"
import { LOG_CHANNEL_ID } from "env"

export async function Track(commands: any) {
  commands?.create({
    name: "track",
    description: "Set a tracker for NFT sales.",
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
}

export async function slashTrackInteraction(interaction: any, options: any) {
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
