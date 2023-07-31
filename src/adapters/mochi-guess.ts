import { MOCHI_GUESS_API_KEY } from "env"
import { MOCHI_GUESS_API_BASE_URL } from "utils/constants"
import { Fetcher } from "./fetcher"
import { RequestInit } from "./fetcher/types"

class MochiGuess extends Fetcher {
  private key = MOCHI_GUESS_API_KEY

  protected async jsonFetch(url: string, init?: RequestInit) {
    return await super.jsonFetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `ApiKey ${this.key}`,
      },
    })
  }

  public async getGames() {
    return await this.jsonFetch(`${MOCHI_GUESS_API_BASE_URL}/games`)
  }

  public async createGame(body: {
    bet_default_value?: number
    duration: number
    host_id: string
    options: string[]
    question: string
    referee_id: string
    thread_id: string
    token_id?: string
  }) {
    body.bet_default_value ||= 0.01
    body.token_id ||= "61388b7c-5505-4fdf-8084-077422369a93"
    // body.token_id ||= "941f0fb1-00da-49dc-a538-5e81fc874cb4"
    return await this.jsonFetch(`${MOCHI_GUESS_API_BASE_URL}/games`, {
      method: "POST",
      body,
    })
  }

  public async joinGame(id: number, player_id: string, option_code: string) {
    return await this.jsonFetch(
      `${MOCHI_GUESS_API_BASE_URL}/games/${id}/join`,
      {
        method: "POST",
        body: {
          bet_amount: 0.01,
          option_code,
          player_id,
        },
      }
    )
  }

  public async getGame(id: string) {
    return await this.jsonFetch(`${MOCHI_GUESS_API_BASE_URL}/games/${id}`)
  }

  public async getGameProgress(id: string) {
    return await this.jsonFetch(
      `${MOCHI_GUESS_API_BASE_URL}/games/${id}/progress`
    )
  }

  public async endGame(id: number, referee_id: string, option_code: string) {
    return await this.jsonFetch(
      `${MOCHI_GUESS_API_BASE_URL}/games/${id}/result`,
      {
        method: "POST",
        body: {
          option_code,
          referee_id,
          distribute_reward: true,
        },
      }
    )
  }
}

export default new MochiGuess()
