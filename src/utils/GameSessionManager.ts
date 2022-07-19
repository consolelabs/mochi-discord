import { Snowflake, User } from "discord.js"
import { logger } from "logger"
import type { Game as TripodGame } from "triple-pod-game-engine"

type Session = {
  name: TripodGame["name"]
  data: {
    game: TripodGame
  }
}

// 5 mins
const DEFAULT_TIMEOUT_DURATION_IN_MS = 300000

class GameSessionManager {
  private sessionByUser: Map<Snowflake, Session> = new Map()
  private usersBySession: Map<Session, Array<Snowflake>> = new Map()
  private sessions: Array<Session> = []
  private timeoutCheckers: Map<Session, NodeJS.Timeout> = new Map()
  private timeouts: Map<Session, number> = new Map()

  // this function checks for session timeout
  // if it is then the session is removed, otherwise it will reschedule another check later
  checkSessionTimeout(session: Session) {
    return setTimeout(() => {
      const now = Date.now()
      const expireAt = this.timeouts.get(session)
      // expired -> remove
      if (now > expireAt) {
        logger.info(`[${session.name}/${session.data.game.id}] timed out`)
        this.removeSession(session)
        this.timeoutCheckers.delete(session)
      } else {
        // session still valid, schedule another check
        this.timeoutCheckers.set(session, this.checkSessionTimeout(session))
      }
    }, DEFAULT_TIMEOUT_DURATION_IN_MS)
  }

  refreshSession(session: Session) {
    clearTimeout(this.timeoutCheckers.get(session))
    this.timeouts.set(session, Date.now() + DEFAULT_TIMEOUT_DURATION_IN_MS)
    this.timeoutCheckers.set(session, this.checkSessionTimeout(session))
  }

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
    this.refreshSession(session)
    return true
  }

  joinSession(initiator: User, joiner: User) {
    const session = this.sessionByUser.get(initiator.id)
    if (session) {
      this.sessionByUser.set(joiner.id, session)
      this.usersBySession.get(session).push(joiner.id)
      this.refreshSession(session)
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
      this.refreshSession(session)
      return true
    }
    return false
  }

  getSession(user: User) {
    const session = this.sessionByUser.get(user.id)
    if (session) {
      this.refreshSession(session)
    }
    return session
  }

  removeSession(session: Session) {
    const userIds = this.usersBySession.get(session)
    if (Array.isArray(userIds)) {
      for (const id of userIds) {
        this.sessionByUser.delete(id)
      }
    }

    this.timeouts.delete(session)
    this.timeoutCheckers.delete(session)
    this.usersBySession.delete(session)
  }
}

export default new GameSessionManager()
