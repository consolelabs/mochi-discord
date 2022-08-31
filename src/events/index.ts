import { ClientEvents, Collection } from "discord.js"
import messageCreate from "./messageCreate"
import ready from "./ready"
import interactionCreate from "./interactionCreate"
import messageReactionAdd from "./messageReactionAdd"
import guildCreate from "./guildCreate"
import guildMemberAdd from "./guildMemberAdd"
import inviteDelete from "./inviteDelete"
import inviteCreate from "./inviteCreate"
import messageReactionRemove from "./messageReactionRemove"

export type Event<T extends keyof ClientEvents> = {
  name: T
  once?: boolean
  execute: (...data: ClientEvents[T]) => void | Promise<unknown>
}

export const invites = new Collection<string, Collection<string, number>>()

export default [
  ready,
  messageCreate,
  interactionCreate,
  messageReactionAdd,
  messageReactionRemove,
  guildCreate,
  guildMemberAdd,
  inviteCreate,
  inviteDelete,
]
