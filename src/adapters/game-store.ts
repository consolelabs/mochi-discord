import { Fetcher } from "./fetcher"
import { GAME_STORE_API_BASE_URL } from "utils/constants"

class GameStore extends Fetcher {
  public async listGames() {
    return await this.jsonFetch(`${GAME_STORE_API_BASE_URL}/games`)
  }

  public async gameDetail(id: number) {
    return await this.jsonFetch(`${GAME_STORE_API_BASE_URL}/games/${id}`)
  }
}

export default new GameStore()
