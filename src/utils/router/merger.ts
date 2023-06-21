import type { MachineConfig } from "./types"
import { merge } from "lodash"

function getContext(states?: MachineConfig) {
  if (!states) return {}
  let context = {}

  for (const [, state] of Object.entries<MachineConfig>(states as any)) {
    context = {
      ...context,
      ...state.context,
      ...getContext(state.states as any),
    }
  }

  return context
}

export default function mergeConfig(
  ...configs: MachineConfig[]
): MachineConfig {
  const [target, ...sources] = configs
  let context = target.context ?? {}

  for (const source of sources) {
    context = {
      ...context,
      ...getContext(source),
    }
  }

  return {
    ...target,
    context,
  }
}
