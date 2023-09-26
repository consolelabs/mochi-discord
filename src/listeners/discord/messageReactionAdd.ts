import { DiscordEvent } from "."

const event: DiscordEvent<"messageReactionAdd"> = {
  name: "messageReactionAdd",
  once: false,
  execute: async () => {},
}

export default event
