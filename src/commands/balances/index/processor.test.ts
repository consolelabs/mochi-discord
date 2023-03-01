import defi from "adapters/defi"
import { SnowflakeUtil } from "discord.js"
import { APIError } from "errors"
import mockdc from "../../../../tests/mocks/discord"
import { getBalances } from "./processor"

jest.mock("adapters/defi")

describe("getBalances", () => {
  const msg = mockdc.cloneMessage()
  const userId = SnowflakeUtil.generate()
  test("successful - user has balance", async () => {
    const type = 1 //offchain
    const balResp = {
      ok: true,
      data: [
        {
          balances: 10,
          balances_in_usd: 20,
          id: "fantom",
          name: "Fantom",
          rate_in_usd: 2,
          symbol: "FTM",
        },
      ],
    }
    const expected = [
      {
        id: "fantom",
        name: "Fantom",
        symbol: "FTM",
        balances: 10,
        balances_in_usd: 20,
        rate_in_usd: 2,
      },
    ]
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(balResp)
    const output = await getBalances(userId, type, msg)
    expect(output).toStrictEqual(expected)
  })
  test("successful - user has no balance", async () => {
    const type = 1 //offchain
    const balResp = {
      ok: true,
      data: [],
    }
    const expected: any[] = []
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(balResp)
    const output = await getBalances(userId, type, msg)
    expect(output).toStrictEqual(expected)
  })
  test("fail - API error", async () => {
    const type = 1 //offchain
    const balResp = {
      ok: false,
      data: [],
    }
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(balResp)
    try {
      await getBalances(userId, type, msg)
    } catch (error) {
      expect(error).toBeInstanceOf(APIError)
    }
  })
})
