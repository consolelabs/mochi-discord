import { Awaitable, ClientEvents } from "discord.js"
import ready from "./ready"
import interactionCreate from "./interactionCreate"
import messageReactionAdd from "./messageReactionAdd"
import guildCreate from "./guildCreate"
import guildMemberRemove from "./guildMemberRemove"
import guildMemberAdd from "./guildMemberAdd"
import messageReactionRemove from "./messageReactionRemove"
import guildDelete from "./guildDelete"

export type DiscordEvent<T extends keyof ClientEvents> = {
  name: T
  once?: boolean
  execute: (...data: ClientEvents[T]) => Awaitable<void>
}

export default [
  ready,
  interactionCreate,
  messageReactionAdd,
  messageReactionRemove,
  guildMemberAdd,
  guildCreate,
  guildDelete,
  guildMemberRemove,
]
