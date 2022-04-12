import { Message } from "discord.js"

// Messages Mock
export const getMessage = (author_id = "", channel_id = ""): Message => {
  return {
    channel: {
      id: channel_id,
      send: jest.fn(),
    },
    author: {
      id: author_id,
      send: jest.fn(),
    },
    reply: jest.fn(),
  } as unknown as Message
}
