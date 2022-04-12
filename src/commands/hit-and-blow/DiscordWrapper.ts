import {
  EmbedFieldData,
  GuildMember,
  Message,
  MessageEmbed,
  TextBasedChannels,
} from "discord.js"
import { Game, Peg, Player } from "hit-and-blow"
import UserActionManager from "utils/UserActionManager"
import GameManager from "./GameManager"

const ALL_PEGS = [
  Peg.RED,
  Peg.BLUE,
  Peg.BROWN,
  Peg.GREEN,
  Peg.PURPLE,
  Peg.YELLOW,
]

export function fromPeg(peg: Peg) {
  switch (peg) {
    case Peg.RED:
      return "🔴"
    case Peg.BLUE:
      return "🔵"
    case Peg.BROWN:
      return "🟤"
    case Peg.GREEN:
      return "🟢"
    case Peg.PURPLE:
      return "🟣"
    case Peg.YELLOW:
      return "🟡"
    default:
      throw new Error("Invalid peg")
  }
}

export function toPeg(input: string) {
  switch (input) {
    case "🔴":
      return Peg.RED
    case "🔵":
      return Peg.BLUE
    case "🟤":
      return Peg.BROWN
    case "🟢":
      return Peg.GREEN
    case "🟣":
      return Peg.PURPLE
    case "🟡":
      return Peg.YELLOW
    default:
      throw new Error("Invalid peg input")
  }
}

export class DiscordWrapper {
  public game: Game | null = null
  public guessMsg: Message
  public action: (arg: any) => void = () => {}
  public players: Map<string, GuildMember> = new Map()
  public ruleShown: boolean = false
  public rule: Message | null = null
  public playersReadTheRule: boolean[] = []

  constructor(
    public id: string,
    public hostId: string,
    public channel: TextBasedChannels,
    numOfRound: number
  ) {
    this.game = new Game(numOfRound)
    this.game.open()
  }

  public async showRule() {
    if (this.ruleShown) return
    this.ruleShown = true

    let embed = new MessageEmbed()
      .setTitle("The rule")
      .setDescription(
        "Each round the players is divided into two types: `CodeMaker` and `CodeBreaker`"
      )
      .setFields([
        {
          name: "CodeMaker",
          value:
            "```Given a set of colors (called pegs), you must arrange 4 pegs to form a secret code that only you will know, your goal is to make it as hard to unpredictable as it can be (e.g 🔴 🟣 🟡 🔵).```",
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: true,
        },
        {
          name: "CodeBreaker",
          value:
            "```Your mission is to guess the code within as few turns as possible. Each guess will yield a result of Hits and Blows```",
          inline: true,
        },
        {
          name: "Hits & Blows",
          value:
            "```- A hit means one peg in your guess is right about both its position and color\n\n- A blow means it is right about color but not its position.```",
        },
        {
          name: "Example",
          value:
            "You guess: `🟢 🟡 🟤 🔵`\nCode is: `🔵 🟢 🟤 🔴`\nIt will be 1 Hits and 2 Blows!",
        },
      ])
      .setFooter(
        "All players after reading the rule please react with ✅ to continue"
      )

    this.rule = await this.channel.send({ embeds: [embed] })
    this.rule.react("✅")
    GameManager.gameByRuleMessageId.set(this.rule.id, this)
  }

  public join(user: GuildMember, player: Pick<Player, "id" | "name">) {
    this.players.set(player.id, user)
    this.game.join({
      ...player,
      onResult: async (result) => {
        this.guessMsg.reply(`${result[0]} hits, ${result[1]} blows!`)
      },
      guess: () => {
        let embed = new MessageEmbed()
          .setTitle("Break the code")
          .setDescription(
            `_**Turn ${
              this.game.turn
            }/${this.game.getMaxTurn()}**_\n${this.players.get(
              this.game.currentPlayer().id
            )} to guess\n\n❓ ❓ ❓ ❓\n`
          )

        if (this.game.moves.length > 0) {
          let moves: EmbedFieldData[] = []
          for (let [index, move] of this.game.moves.entries()) {
            moves.push(
              ...[
                {
                  name: `Turn ${index + 1} by ${move.name}`,
                  value: move.guess.map(fromPeg).join(" "),
                  inline: true,
                },
                {
                  name: "\u200b",
                  value: "\u200b",
                  inline: true,
                },
                {
                  name: "Result",
                  value: `${move.result[0]} hits, ${move.result[1]} blows`,
                  inline: true,
                },
              ]
            )
          }

          embed.setFields(moves)
        }

        this.channel.send({
          content: `${Array.from(this.players.values()).join(", ")}`,
          embeds: [embed],
        })

        return new Promise((r) => {
          this.action = (v) => r(v)
        })
      },
      getAnswer: () => {
        const codemaker = this.game.players.find((p) => p.role === "codemaker")
        const player = this.players.get(codemaker.id)
        this.channel.send({
          content: `Pssstt, ${player}, you've been selected as the \`CodeMaker\`, please DM me the code for this round 😎.`,
        })
        player.send(
          `Pick 4 colors out of ${ALL_PEGS.map(fromPeg).join(
            ", "
          )} and arrange them however you like, separated by whitespace to form a code.`
        )

        return new Promise((r) => {
          UserActionManager.set(codemaker.id, (msg) => {
            try {
              const code = msg.content.split(" ").map(toPeg)
              if (code.length !== 4) {
                msg.reply("Not enough code")
                return
              }

              r(code as [Peg, Peg, Peg, Peg])
            } catch (e) {
              msg.reply("Your format is not right, please try again")
            }
          })
        })
      },
    })
  }
}
