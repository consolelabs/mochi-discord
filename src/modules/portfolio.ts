import { logger } from "logger"
import { PortfolioResponse, Portfolio as CalculatedPortfolio } from "types"
import fetch from "node-fetch"
import { API_SERVER_HOST } from "env"

class Portfolio {
  public async getData(address: string): Promise<PortfolioResponse> {
    try {
      const res = await fetch(
        `${API_SERVER_HOST}/api/v1/user/portfolio?user_address=${address}`
      )
      const json = await res.json()
      return json as PortfolioResponse
    } catch (e: any) {
      logger.error(e)
    }
  }

  public calculate(data: PortfolioResponse): CalculatedPortfolio {
    return {
      ...data,
      asset: data.balance.chain_list
        .filter((c) => c.usd_value > 0)
        .map((c) => {
          return {
            chain: c.name,
            amount_usd_value: Number(c.usd_value.toFixed(0)),
            percentage: Number(
              ((c.usd_value / data.balance.total_usd_value) * 100).toFixed(0)
            ),
          }
        }),
    }
  }
}

export default new Portfolio()
