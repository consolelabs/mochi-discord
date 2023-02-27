import defi from "adapters/defi"
import { CommandInteraction } from "discord.js"
import { InternalError } from "errors"
import run from "./slash"

jest.mock("adapters/defi")

describe("run", () => {
  let i: CommandInteraction

  test("token not supported", async () => {
    const coinData = {
      ok: true,
      data: null,
    }
    defi.searchCoins = jest.fn().mockResolvedValueOnce(coinData)
    await expect(run(i, "123btc45")).rejects.toThrow(InternalError)
  })
})
