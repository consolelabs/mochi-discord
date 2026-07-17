import defi from "adapters/defi"
import mochiPay from "adapters/mochi-pay"

import { BalanceType, getBalances } from "./processor"

jest.mock("adapters/defi")
jest.mock("adapters/mochi-pay")

// Sub-goal 05 (mega-goal mochi-defi-surface-repair): an `ok` response whose
// data is null or missing the expected array field must degrade to an empty
// balance, never crash the /bal render with
// `Cannot read properties of ... (reading 'filter')`.
const msg = {} as any
const okNull = { ok: true, data: null }
const okEmpty = { ok: true, data: {} }

describe("getBalances guards malformed API responses", () => {
  beforeEach(() => jest.clearAllMocks())

  it("offchain: data null -> empty, no throw", async () => {
    ;(mochiPay.getBalances as jest.Mock).mockResolvedValue(okNull)
    const r = await getBalances("p", "d", BalanceType.Offchain, msg, "")
    expect(r.data).toEqual([])
  })

  it("all: data missing summarize -> empty, no throw", async () => {
    ;(defi.getAllBalances as jest.Mock).mockResolvedValue(okEmpty)
    const r = await getBalances("p", "d", BalanceType.All, msg, "")
    expect(r.data).toEqual([])
  })

  it("all: data null -> empty, no throw", async () => {
    ;(defi.getAllBalances as jest.Mock).mockResolvedValue(okNull)
    const r = await getBalances("p", "d", BalanceType.All, msg, "")
    expect(r.data).toEqual([])
  })

  it("onchain: data null -> empty, no throw", async () => {
    ;(defi.getWalletAssets as jest.Mock).mockResolvedValue(okNull)
    const r = await getBalances("p", "d", BalanceType.Onchain, msg, "0xabc")
    expect(r.data).toEqual([])
  })

  it("cex: data null -> empty, no throw", async () => {
    ;(defi.getDexAssets as jest.Mock).mockResolvedValue(okNull)
    const r = await getBalances("p", "d", BalanceType.Cex, msg, "")
    expect(r.data).toEqual([])
  })

  it("cex: data missing asset/earn -> empty, no throw", async () => {
    ;(defi.getDexAssets as jest.Mock).mockResolvedValue(okEmpty)
    const r = await getBalances("p", "d", BalanceType.Cex, msg, "")
    expect(r.data).toEqual([])
  })
})
