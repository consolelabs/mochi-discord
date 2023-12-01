import mockdc from "../../../../tests/mocks/discord"
import Defi from "../../../adapters/defi"
import { APIError } from "errors"
import * as processor from "./processor"
jest.mock("adapters/defi")
jest.mock("adapters/config")
jest.mock("ui/discord/select-menu")
jest.mock("ui/discord/button")

describe("process", () => {
  const msg = mockdc.cloneMessage()
  msg.content = "$token add"

  beforeEach(() => jest.clearAllMocks())

  test("Should throw API Error", async () => {
    const args = {
      guild_id: "test",
      user_discord_id: "test",
      channel_id: "test",
      message_id: "test",
      token_address: "test",
      token_chain: "SOL",
    }
    const res = {
      ok: false,
      error: "",
      log: "",
      curl: "",
      status: 500,
    }
    Defi.requestSupportToken = jest.fn().mockResolvedValueOnce(res)
    await expect(processor.process(msg, args)).rejects.toThrow(
      new APIError({
        msgOrInteraction: msg,
        error: res.error,
        curl: res.curl,
        description: res.log,
        status: res.status,
      }),
    )
  })
})
