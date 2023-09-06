import type {
  ButtonInteraction,
  MessageEditOptions,
  SelectMenuInteraction,
} from "discord.js"
import { createMachine } from "xstate"

export type Context = {
  button?: ButtonContext
  select?: SelectContext
  steps?: string[]
  modal?: Record<string, true>
  ephemeral?: Record<string, true>
  [K: string]: any
}

type CreateMachineParams = Parameters<typeof createMachine<Context, any, any>>

export type MachineConfig = CreateMachineParams[0] & { id: string }
export type MachineOptions = CreateMachineParams[1]

export type Handler<P = any> = (
  params: P,
  event: string,
  context: Record<any, any>,
  isModal: boolean,
) => Promise<
  | {
      msgOpts: MessageEditOptions | null
      context?: Record<any, any>
    }
  | null
  | void
  | undefined
>

export type ButtonContext = {
  [K: string]: Handler<ButtonInteraction>
}

export type SelectContext = {
  [K: string]: Handler<SelectMenuInteraction>
}
