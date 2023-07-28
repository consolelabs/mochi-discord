import { InvestBalance } from "types/mochipay"
import { formatDataTable } from "ui/discord/embed"
import { TokenEmojiKey, getEmoji } from "utils/common"
import { APPROX, VERTICAL_BAR } from "utils/constants"
import { formatTokenDigit, formatUsdDigit } from "utils/defi"

export function composeInvestPortfolio(data: InvestBalance[]) {
  const info = data.map((invest) => {
    const decimals = invest.to_underlying_token.decimals
    const tokenAmount =
      Number(invest.to_underlying_token?.balance) / 10 ** decimals
    const amount = `${formatTokenDigit(tokenAmount)} ${
      invest.to_underlying_token.symbol
    }`
    const apy = `${formatTokenDigit(invest.apy)}%`
    const usdWorth = `$${formatUsdDigit(invest.underlying_usd)}`
    const platform = invest.platform.name || ""
    const symbol = invest.to_underlying_token?.symbol || ""

    return {
      emoji: getEmoji(symbol as TokenEmojiKey),
      amount,
      usdWorth,
      platform: platform,
      apy: apy,
    }
  })

  const { segments } = formatDataTable(info, {
    cols: ["amount", "usdWorth", "platform", "apy"],
    rowAfterFormatter: (f, i) => `${info[i].emoji}${f}${getEmoji("GIFT")}`,
    separator: [` ${APPROX} `, VERTICAL_BAR, VERTICAL_BAR],
  })

  return `${segments.map((c) => c.join("\n"))}`
}
