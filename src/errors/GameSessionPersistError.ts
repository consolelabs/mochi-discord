import { BotBaseError } from "./BaseError"

export class GameSessionPersistError extends BotBaseError {
  constructor({
    gameName,
    gameId,
    err,
    guild,
    channel,
    userId,
  }: {
    guild: string
    channel: string
    userId: string
    gameName: string
    gameId: string
    err: string
  }) {
    super()
    this.name = `Couldn't persist game id ${gameId} of game ${gameName} by user id ${userId}, error was ${err}`
    this.message = JSON.stringify({
      guild,
      channel,
      userId,
      data: { gameName, gameId },
    })
  }
}
