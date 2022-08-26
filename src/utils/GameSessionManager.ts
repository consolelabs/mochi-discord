import { Snowflake } from "discord.js"
import { logger } from "logger"
import { Game as TripodGame } from "triple-pod-game-engine"
import ChannelLogger from "./ChannelLogger"
import { GameSessionPersistError } from "errors/GameSessionPersistError"
import { restoreGameState } from "commands/games/tripod/helpers"
import { firestore } from "./firebase"
import { InmemoryStorage } from "types/InmemoryStorage"

type GameName = TripodGame["name"]

type Session = {
  name: TripodGame["name"]
  data: {
    game: TripodGame
    guild: string
    channel: string
    userId: string
    username: string
    discriminator: string
    balance: number
  }
}

const gameSessionsKey = "game-sessions"
const leaderboardKey = "leaderboard"

// 15 mins
const DEFAULT_TIMEOUT_DURATION_IN_MS = 900000

class GameSessionManager extends InmemoryStorage {
  private sessionByUser: Map<Snowflake, Session> = new Map()
  private usersBySession: Map<Session, Array<Snowflake>> = new Map()
  private sessions: Array<Session> = []
  private timeoutCheckers: Map<Session, NodeJS.Timeout> = new Map()
  private timeouts: Map<Session, number> = new Map()
  private store: FirebaseFirestore.Firestore | null
  private loading = false
  private loaded = false

  constructor() {
    super()
    this.store = firestore
    this.up()
  }

  protected async up() {
    if (!this.store) return
    logger.info("[GameSessionManager] - firestore retrieving session data...")
    this.loading = true
    const collections = await this.store.listCollections()
    const promises = collections.map(async (col) => {
      if (col.id === gameSessionsKey) {
        const snapshot = await col.get()
        snapshot.forEach((doc) => {
          const data = doc.data()
          if (!data.ended) {
            let Game
            let name: GameName | null = null
            switch (data.game) {
              case "triple-pod":
                Game = TripodGame
                name = "triple-pod"
                break
              default:
                break
            }
            if (Game && name) {
              let game = new Game({ id: data.gameId })
              game.join({ name: data.username, id: doc.id })
              const history = JSON.parse(data.history)
              game = restoreGameState(game, history)
              this.createSessionIfNotAlready(doc.id, {
                name,
                data: {
                  game,
                  userId: doc.id,
                  channel: data.channel,
                  guild: data.guild,
                  username: data.username,
                  discriminator: data.discriminator,
                  balance: data.balance,
                },
              })
            }
          }
        })
      }
    })

    await Promise.all(promises)
    await this.getPoints()
    this.loading = false
    this.loaded = true
    logger.info("[GameSessionManager] - firestore retrieve OK")
  }

  async getPoints() {
    if (!this.store) return { allData: {}, leaderboard: [] }
    const col = this.store.collection(leaderboardKey)
    let snapshot = await col.orderBy("pts", "desc").limit(10).get()
    const leaderboard: any = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      leaderboard.push(data)
    })
    const allData: Record<string, any> = {}
    snapshot = await col.get()
    snapshot.forEach((doc) => {
      const data = doc.data()
      allData[doc.id] = data
    })

    return { allData, leaderboard }
  }

  // this function checks for session timeout
  // if it is then the session is removed, otherwise it will reschedule another check later
  checkSessionTimeout(session: Session) {
    return setTimeout(() => {
      const now = Date.now()
      const expireAt = this.timeouts.get(session) ?? 0
      // expired -> remove
      if (now > expireAt) {
        logger.info(
          `[GameSessionManager] - ${session.name}/${session.data.game.id} timed out`
        )
        this.removeSession(session)
        this.timeoutCheckers.delete(session)
      } else {
        // session still valid, schedule another check
        this.timeoutCheckers.set(session, this.checkSessionTimeout(session))
      }
    }, DEFAULT_TIMEOUT_DURATION_IN_MS)
  }

  refreshSession(session: Session) {
    const timeoutId = this.timeoutCheckers.get(session)
    if (timeoutId) {
      global.clearTimeout(timeoutId)
    }
    const newExpireAt = Date.now() + DEFAULT_TIMEOUT_DURATION_IN_MS
    this.timeouts.set(session, newExpireAt)
    this.timeoutCheckers.set(session, this.checkSessionTimeout(session))
    if (this.store && this.loaded && !this.loading) {
      const sessionRef = this.store
        .collection(gameSessionsKey)
        .doc(session.data.userId)
      const pointRef = this.store
        .collection(leaderboardKey)
        .doc(session.data.userId)
      try {
        sessionRef.set({
          game: session.name,
          channel: session.data.channel,
          guild: session.data.guild,
          gameId: session.data.game.id,
          expireAt: newExpireAt,
          history: JSON.stringify([...session.data.game.history].reverse()),
          ended: session.data.game.done,
          username: session.data.username,
          discriminator: session.data.discriminator,
          balance: session.data.balance,
        })
        pointRef.get().then((doc) => {
          const data = doc.data()
          const pts = Number(data?.pts ?? 0)
          if (session.data.game.state.points > pts) {
            pointRef.set({
              username: session.data.username,
              discriminator: session.data.discriminator,
              pts: session.data.game.state.points,
            })
          }
        })
      } catch (e: any) {
        ChannelLogger.log(
          new GameSessionPersistError({
            guild: session.data.guild,
            channel: session.data.channel,
            gameId: session.data.game.id,
            gameName: session.name,
            userId: session.data.userId,
            err: e?.message ?? "Unknown",
          })
        )
      }
    }
  }

  createSessionIfNotAlready(initiatorId: string, session: Session) {
    if (
      this.sessions.includes(session) ||
      this.sessionByUser.get(initiatorId)
    ) {
      return false
    }
    this.sessions.push(session)
    this.sessionByUser.set(initiatorId, session)
    this.usersBySession.set(session, [initiatorId])
    this.refreshSession(session)
    return true
  }

  joinSession(initiatorId: string, joinerId: string) {
    const session = this.sessionByUser.get(initiatorId)
    if (session) {
      this.sessionByUser.set(joinerId, session)
      this.usersBySession.get(session)?.push(joinerId)
      this.refreshSession(session)
      return true
    }
    return false
  }

  leaveSession(userId: string) {
    const session = this.sessionByUser.get(userId)
    if (session) {
      const newSession = this.usersBySession
        .get(session)
        ?.filter((id) => id !== userId)
      if (newSession) {
        this.sessionByUser.delete(userId)
        this.usersBySession.set(session, newSession)
        this.refreshSession(session)
        return true
      }
    }
    return false
  }

  getSession(userId: string) {
    const session = this.sessionByUser.get(userId)
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
