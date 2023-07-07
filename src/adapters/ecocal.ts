import { Fetcher } from "./fetcher"
import { ECOCAL_API_BASE_URL } from "utils/constants"
import { ECOCAL_API_KEY } from "env"
class Ecocal extends Fetcher {
  public async getEcocal(
    impact: string,
    startTime: string,
    endTime: string
  ): Promise<any[]> {
    const url = `${ECOCAL_API_BASE_URL}/economic-calendars?impact=${impact}&start_time=${startTime}&end_time=${endTime}&api_key=${ECOCAL_API_KEY}`
    const { data: res, ok } = await this.jsonFetch(url)
    let data = []
    if (ok) {
      data = res as any[]
    }

    return data
  }
}

export default new Ecocal()
