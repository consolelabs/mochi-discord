import { Command } from "commands"
import { PREFIX } from "env"

export class FactsAndTipsManager {
  private messages: [string, "fact" | "tip"][] = []

  constructor(originalCommands: Record<string, Command>) {
    this.messages = [
      [
        "In Pod Together we use `Reaper/Beefy` as our compounders behind the scene!",
        "fact",
      ],
      ["Staking Nekos in Pod Town will earn you rewards.", "fact"],
      [
        `You can use \`${PREFIX}${originalCommands.xp.command}\` to see which events earn you xp points.`,
        "tip",
      ],
      [
        `To connect your twitter, checkout \`${PREFIX}${originalCommands.twitter.command}\`!`,
        "tip",
      ],
      [
        "`Paw Fellowship` card is an NFT that is given to those that were affected by the Grim exploitation, keep it tight as it will grant you various benefits down the road!",
        "fact",
      ],
      ["`OG Card` are NFTs that were distributed to original minters.", "fact"],
      ["`Neko#57` were bought for **4777** FTM.", "fact"],
      [
        "Pod Town is known for its **friendly** and **supportive** community.",
        "fact",
      ],
      [
        `\`${PREFIX}${originalCommands.profile.command}\` is your go-to command after you've verified.`,
        "tip",
      ],
      [
        `You can tip other users with \`${PREFIX}${originalCommands.tip.command}\`!`,
        "tip",
      ],
      [
        "You can only earn more money while playing Pod Together - it's a **`win-win`** situation.",
        "fact",
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
