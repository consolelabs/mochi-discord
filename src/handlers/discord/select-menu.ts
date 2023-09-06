import {
  Client,
  Message,
  MessageComponentInteraction,
  MessageEditOptions,
} from "discord.js"
import type { RunResult } from "types/common"

export type InteractionHandlerResult = RunResult<MessageEditOptions>

export type InteractionHandler = (
  msgOrInteraction: Message | MessageComponentInteraction,
) => Promise<InteractionHandlerResult>

export type InteractionOptions = {
  handler: InteractionHandler
}

// 30 mins
const TIMEOUT = 1800000

class InteractionManager {
  interactions: Map<string, InteractionOptions> = new Map()
  timeouts: Map<string, NodeJS.Timeout> = new Map()
  client: Client | null = null

  debounce(key: string) {
    const oldTimeoutId = this.timeouts.get(key)
    globalThis.clearTimeout(oldTimeoutId)
    const id = globalThis.setTimeout(() => {
      this.remove(key)
    }, TIMEOUT)
    this.timeouts.set(key, id)
  }

  remove(key: string) {
    this.interactions.delete(key)
  }

  async update(key: string, newValue: Partial<InteractionOptions>) {
    const options = this.interactions.get(key)
    if (!options) return
    const updatedValue = {
      ...options,
      ...newValue,
    }
    this.interactions.set(key, updatedValue)
  }

  async get(key: string) {
    return this.interactions.get(key)
  }

  async add(key: string, options: InteractionOptions) {
    this.interactions.set(key, options)
    this.debounce(key)
  }
}

export default new InteractionManager()
