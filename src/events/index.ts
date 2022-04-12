import { ClientEvents } from "discord.js"
import messageCreate from "./messageCreate"
import ready from "./ready"
import interactionCreate from "./interactionCreate"
import messageReactionAdd from "./messageReactionAdd"
import guildCreate from "./guildCreate"

export type Event<T extends keyof ClientEvents> = {
  name: T
  once?: boolean
  execute: (...data: ClientEvents[T]) => void | Promise<any>
}

export default [ready, messageCreate, interactionCreate, messageReactionAdd, guildCreate]
