import { DiscordEvent } from "."

const event: DiscordEvent<"messageDelete"> = {
  name: "messageDelete",
  once: false,
  execute: async () => {},
}

export default event
