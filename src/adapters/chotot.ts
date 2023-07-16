import { Fetcher } from "./fetcher"
import { CHOTOT_GATEWAY_URL } from "utils/constants"

class ChoTot extends Fetcher {
  public async getSuggestions(keywords: string) {
    return await this.jsonFetch<{ results: any }>(
      `${CHOTOT_GATEWAY_URL}/v2/public/search-suggestion/search`,
      {
        query: {
          keywords,
        },
      }
    )
  }
  public async getListItems(
    queryString: string,
    page: number,
    pageSize: number
  ) {
    return await this.jsonFetch<{ variant: number; total: number; ads: any[] }>(
      `${CHOTOT_GATEWAY_URL}/v1/public/ad-listing?${queryString}&page=${page}&limit=${pageSize}`
    )
  }
  public async getAdDetail(listId: string) {
    return await this.jsonFetch<{ variant: number; total: number; ads: any[] }>(
      `${CHOTOT_GATEWAY_URL}/v1/public/ad-listing?list_id=${listId}`
    )
  }
}

export default new ChoTot()
