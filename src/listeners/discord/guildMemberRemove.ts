import { DiscordEvent } from "."

const event: DiscordEvent<"guildMemberRemove"> = {
  name: "guildMemberRemove",
  once: false,
  execute: async () => {},
}

export default event
