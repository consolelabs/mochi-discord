import { ICY_API_BASE_URL } from "utils/constants"
import { Fetcher } from "./fetcher"
import { IcyInfoResponse } from "../types/icy"

class Icy extends Fetcher {
  async getIcyInfo() {
    return await this.jsonFetch<IcyInfoResponse>(
      `${ICY_API_BASE_URL}/swap/info`,
    )
  }
}

export default new Icy()
