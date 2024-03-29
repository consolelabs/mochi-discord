import {
  AutocompleteInteraction,
  CommandInteraction,
  Message,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from "discord.js"
import { AsyncLocalStorage } from "node:async_hooks"

type Storage = {
  msgOrInteraction?:
    | Message
    | CommandInteraction
    | ModalSubmitInteraction
    | MessageComponentInteraction
    | AutocompleteInteraction
  data: string
  start?: number
}

export const textCommandAsyncStore = new AsyncLocalStorage<Storage>()
export const slashCommandAsyncStore = new AsyncLocalStorage<Storage>()
export const eventAsyncStore = new AsyncLocalStorage<Storage>()
export const profilingAsyncStore = new AsyncLocalStorage<number>()
