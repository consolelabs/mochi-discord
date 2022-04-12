import { User } from "discord.js"
import { GameState } from "hit-and-blow"
import UserActionManager from "utils/UserActionManager"
import { DiscordWrapper, fromPeg } from "./DiscordWrapper"

export class GameManager {
  public games: Map<string, DiscordWrapper> = new Map()
  public players: Set<string> = new Set()
  public gameByPlayerId: Map<string, DiscordWrapper> = new Map()
  public gameByRuleMessageId: Map<string, DiscordWrapper> = new Map()

  constructor() {}

  public get(id: string) {
    return this.games.has(id)
      ? this.games.get(id)
      : this.gameByPlayerId.has(id)
      ? this.gameByPlayerId.get(id)
      : this.gameByRuleMessageId.get(id)
  }

  public add(wrapper: DiscordWrapper) {
    if (this.games.has(wrapper.id)) return
    this.games.set(wrapper.id, wrapper)

    wrapper.game.onStateChange = async (oldState, newState) => {
      if (
        oldState === GameState.JOINING &&
        newState === GameState.INITIALIZING
      ) {
        for (let player of wrapper.game.players) {
          this.players.add(player.id)
          this.gameByPlayerId.set(player.id, wrapper)
        }
      }

      if (newState === GameState.ENDED) {
        wrapper.channel.send("Game ended!")
        const result = wrapper.game.rounds.at(wrapper.game.rounds.length - 1)
        if (result.winner) {
          const user = await wrapper.channel.client.users.fetch(result.winner)
          wrapper.channel.send(`The code has been broken! ${user} won!!`)
        } else {
          const codemaker = await wrapper.channel.client.users.fetch(
            wrapper.game.players.find((p) => p.role === "codemaker").id
          )
          wrapper.channel.send(
            `The CodeMaker ${codemaker} successfully defended his/her title 😎`
          )
          wrapper.channel.send(
            `The answer is: ${wrapper.game.getAnswer().map(fromPeg).join(" ")}`
          )
        }

        this.remove(wrapper)
      }
    }
  }

  public remove(wrapper: DiscordWrapper) {
    for (let player of wrapper.game.players) {
      this.players.delete(player.id)
      this.gameByPlayerId.delete(player.id)
      UserActionManager.remove(player.id)
    }

    this.games.delete(wrapper.id)
  }

  public isUserInAGame(user: User) {
    return this.players.has(user.id)
  }
}

export default new GameManager()
