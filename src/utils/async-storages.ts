import {
  AutocompleteInteraction,
  CommandInteraction,
  Message,
  MessageComponentInteraction,
} from "discord.js"
import { AsyncLocalStorage } from "node:async_hooks"

type Storage = {
  msgOrInteraction?:
    | Message
    | CommandInteraction
    | MessageComponentInteraction
    | AutocompleteInteraction
  data: string
}

export const textCommandAsyncStore = new AsyncLocalStorage<Storage>()
export const slashCommandAsyncStore = new AsyncLocalStorage<Storage>()
export const eventAsyncStore = new AsyncLocalStorage<Storage>()
