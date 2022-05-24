import fetch from "node-fetch"
import { API_SERVER_HOST } from "env"

export interface CustomCommand {
  id: string
  guild_id: string
  description: string
  actions: any
  enabled: boolean
  cooldown: number
  cooldown_duration: number
  roles_permissions: any
  channels_permissions: any
}

class GuildCustomCommand {
  public async listGuildCustomCommands(
    guild_id: string
  ): Promise<CustomCommand[]> {
    const res = await fetch(
      `${API_SERVER_HOST}/api/v1/guilds/${guild_id}/custom-commands?enabled=true`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    switch (res.status) {
      case 200:
        return (await res.json()).data
      default:
        throw new Error(`Unexpected status code: ${res.status}`)
    }
  }
}

export default new GuildCustomCommand()
