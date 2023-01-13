import { composeEmbedMessage } from "discord/embed/ui"
import type { Command } from "types/common"
import { getEmoji as utilGetEmoji } from "utils/common"
import { PREFIX } from "utils/constants"

const textCmd: Command = {
  id: "tripod",
  command: "tripod",
  brief: "Triple Town",
  category: "Game",
  colorType: "Game",
  run: async function (msg) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: `${utilGetEmoji("GLOWINGHEDGE")} New Tripod Version`,
            description: `To bring you better experience with Tripod, we bring it on the [website](https://tripod-web.vercel.app/). Try it now! ${utilGetEmoji(
              "MOONING"
            )}`,
          }),
        ],
      },
    }
  },
  featured: {
    title: `Tripod`,
    description: "A match-3 game in the PodTown Metaverse",
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}tripod`,
          usage: `${PREFIX}tripod`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
}

export default { textCmd }
