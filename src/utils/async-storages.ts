import { AsyncLocalStorage } from "node:async_hooks"

export const textCommandAsyncStore = new AsyncLocalStorage<string>()
export const slashCommandAsyncStore = new AsyncLocalStorage<string>()
