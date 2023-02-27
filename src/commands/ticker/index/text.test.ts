import defi from "adapters/defi"
import { Message } from "discord.js"
import { InternalError } from "errors"
import run from "./text"

jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message

  test("token not supported", async () => {
    const coinData = {
      ok: true,
      data: null,
    }
    defi.searchCoins = jest.fn().mockResolvedValueOnce(coinData)
    await expect(run(msg, "123btc45")).rejects.toThrow(InternalError)
  })
})
