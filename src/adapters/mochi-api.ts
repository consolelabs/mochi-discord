import fetch from "node-fetch"
import { ResponseListMyGuildsResponse } from "types/api"
import { API_BASE_URL } from "utils/constants"
import { logger } from "logger"
import { Fetcher } from "./fetcher"

class MochiAPI extends Fetcher {
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
    return fetch(
      `${API_BASE_URL}/product-metadata/changelogs/view`, // change to prod url, fetch: Only absolute URLs are supported
      requestOptions,
    )
  }

  public async publicChangelog(changelogName: string, isPublic: boolean) {
    return await this.jsonFetch(
      `${API_BASE_URL}/product-metadata/changelogs/publish`,
      {
        method: "POST",
        body: {
          changelog_name: changelogName,
          is_public: isPublic,
        },
      },
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

  public async publicChangelogViews(profileId: string, changelogName: string) {
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

  public async getBinanceAverageCost(profileId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${profileId}/cexs/binance/average-costs`,
    )
  }

  public async getOnchainAverageCost(walletAddr: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/onchain/average-cost?walletAddress=${walletAddr}`,
    )
  }
}

export default new MochiAPI()
