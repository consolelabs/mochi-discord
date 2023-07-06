import { getEmoji, msgColors } from "./common"

export function somethingWentWrongPayload() {
  return {
    embeds: [
      {
        author: {
          name: "Error",
          iconURL:
            "https://cdn.discordapp.com/emojis/967285238055174195.png?size=240&quality=lossless",
        },
        description: `Our team is fixing the issue. Stay tuned ${getEmoji(
          "NEKOSAD"
        )}.`,
        color: msgColors.ERROR,
      },
    ],
    components: [],
    files: [],
  }
}
