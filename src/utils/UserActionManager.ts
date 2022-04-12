import { Message } from "discord.js"

type Handler = (msg: Message) => void

// Use to manage which action to do when a user DM bot
export class UserActionManager {
  constructor(private map: Map<string, Handler> = new Map()) {}

  public set(id: string, handler: Handler = () => {}) {
    this.map.set(id, handler)
  }

  public remove(id: string) {
    this.map.delete(id)
  }

  public handle(id: string, msg: Message) {
    const handler = this.map.get(id)
    if (handler) {
      handler(msg)
    }
  }
}

export default new UserActionManager()
