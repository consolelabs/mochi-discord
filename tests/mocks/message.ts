import { Message } from "discord.js"
import { mockClient } from "./client"

export const mockMessage = Reflect.construct(Message, [
  mockClient,
  {
    id: 0,
    channel_id: 0,
    author: {
      id: 0,
      username: "",
      discriminator: "",
      avatar: null,
    },
    content: "",
    timestamp: "",
    tts: false,
    mention_everyone: false,
    mentions: [],
    mention_roles: [],
    attachment: [],
    embeds: [],
    type: 0,
  },
])
