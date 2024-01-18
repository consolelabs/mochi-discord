import fetch from "node-fetch"
import { ResponseListMyGuildsResponse } from "types/api"
import { API_BASE_URL } from "utils/constants"
import { logger } from "logger"

class MochiAPI {
  public async updateGuild(guildId: string, req: any) {
    logger.info(
      `Updating the commands for guild ${guildId}... ${API_BASE_URL}/guilds/${guildId}`,
    )
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available_cmds: req }),
    }
    return await fetch(
      `${API_BASE_URL}/guilds/${guildId}`, // change to prod url, fetch: Only absolute URLs are supported
      requestOptions,
    )
  }

  public async getGuilds(): Promise<ResponseListMyGuildsResponse> {
    logger.info(`Getting the guilds...`)
    const response = await fetch(`${API_BASE_URL}/guilds`)
    return await response.json()
  }

  public async createChangelogViews(profileId: string, changelogName: string) {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: profileId, changelog_name: changelogName }),
    }
    return await fetch(
      `${API_BASE_URL}/product-metadata/changelogs/view`, // change to prod url, fetch: Only absolute URLs are supported
      requestOptions,
    )
  }

  public async getChangelogViews(profileId: string, changelogName: string) {
    const requestOptions = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
    const response = await fetch(
      `${API_BASE_URL}/product-metadata/changelogs/view?key=${profileId}&changelog_name=${changelogName}`, // change to prod url, fetch: Only absolute URLs are supported
      requestOptions,
    )
    return response.json()
  }
}

export default new MochiAPI()
