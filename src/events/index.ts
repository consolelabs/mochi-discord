import { Awaitable, ClientEvents } from "discord.js"
import messageCreate from "./messageCreate"
import ready from "./ready"
import interactionCreate from "./interactionCreate"
import messageReactionAdd from "./messageReactionAdd"
import guildCreate from "./guildCreate"
import guildMemberAdd from "./guildMemberAdd"
import inviteDelete from "./inviteDelete"
import inviteCreate from "./inviteCreate"
import messageReactionRemove from "./messageReactionRemove"
import messageDelete from "./messageDelete"
import guildDelete from "./guildDelete"

export type DiscordEvent<T extends keyof ClientEvents> = {
  name: T
  once?: boolean
  execute: (...data: ClientEvents[T]) => Awaitable<void>
}

export default [
  ready,
  messageCreate,
  messageDelete,
  interactionCreate,
  messageReactionAdd,
  messageReactionRemove,
  guildMemberAdd,
  inviteCreate,
  inviteDelete,
  guildCreate,
  guildDelete,
]
