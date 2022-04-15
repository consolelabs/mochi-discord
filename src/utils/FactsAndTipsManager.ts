import { Command } from "types/common"
import { PREFIX } from "utils/constants"

export class FactsAndTipsManager {
  private messages: [string, "fact" | "tip"][] = []

  constructor(originalCommands: Record<string, Command>) {
    this.messages = [
      [
        `To connect your twitter, checkout \`${PREFIX}${originalCommands.twitter.command}\`!`,
        "tip",
      ],
      [
        `\`${PREFIX}${originalCommands.profile.command}\` is your go-to command after you've verified.`,
        "tip",
      ],
      [
        `You can tip other users with \`${PREFIX}${originalCommands.tip.command}\`!`,
        "tip",
      ],
    ]
  }

  random() {
    const random = Math.floor(Math.random() * this.messages.length)

    return {
      message: this.messages[random][0],
      type: this.messages[random][1],
      no: random + 1,
      total: this.messages.length,
    }
  }
}
