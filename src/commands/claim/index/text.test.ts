import { commands } from "commands"
import { Message } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message
  const claimCmd = commands["claim"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("claim successfully with proper args", async () => {
    msg.content = `$claim 1 ftm`
    jest.spyOn(processor, "claim").mockResolvedValueOnce({} as any)
    await claimCmd.run(msg)
    expect(processor.claim).toHaveBeenCalledWith(msg, ["claim", "1", "ftm"])
  })
})
