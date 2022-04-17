import { Event } from "."

export default {
  name: "messageReactionAdd",
  once: false,
  execute: async (_reaction, user) => {
    if (user.bot) return
  },
} as Event<"messageReactionAdd">
