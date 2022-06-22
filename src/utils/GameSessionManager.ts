import { Message, Snowflake, User } from "discord.js"
import type { Game as TripodGame } from "triple-pod-game-engine"
import type { Game as PodkerGame } from "podker-game-engine"

type Session =
  | {
      name: TripodGame["name"]
      data: {
        game: TripodGame
        message: Message
      }
    }
  | {
      name: PodkerGame["name"]
      data: {
        game: PodkerGame
        message: Message
      }
    }

class GameSessionManager {
  private sessionByUser: Map<Snowflake, Session> = new Map()
  private usersBySession: Map<Session, Array<Snowflake>> = new Map()
  private sessions: Array<Session> = []

  createSessionIfNotAlready(initiator: User, session: Session) {
    if (
      this.sessions.includes(session) ||
      this.sessionByUser.get(initiator.id)
    ) {
      return false
    }
    this.sessions.push(session)
    this.sessionByUser.set(initiator.id, session)
    this.usersBySession.set(session, [initiator.id])
    return true
  }

  joinSession(initiator: User, joiner: User) {
    const session = this.sessionByUser.get(initiator.id)
    if (session) {
      this.sessionByUser.set(joiner.id, session)
      this.usersBySession.get(session).push(joiner.id)
      return true
    }
    return false
  }

  leaveSession(user: User) {
    const session = this.sessionByUser.get(user.id)
    if (session) {
      this.sessionByUser.delete(user.id)
      this.usersBySession.set(
        session,
        this.usersBySession.get(session).filter((id) => id !== user.id)
      )
      return true
    }
    return false
  }

  getSession(user: User) {
    return this.sessionByUser.get(user.id)
  }

  removeSession(session: Session) {
    const userIds = this.usersBySession.get(session)
    for (const id of userIds) {
      this.sessionByUser.delete(id)
    }

    this.usersBySession.delete(session)
  }
}

export default new GameSessionManager()
