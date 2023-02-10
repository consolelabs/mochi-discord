import { commands } from "commands"
import { Message } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message
  const depositCmd = commands["deposit"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("run with proper args", async () => {
    msg.content = `$deposit ftm`
    jest.spyOn(processor, "deposit").mockReturnValueOnce({} as any)
    await depositCmd.run(msg)
    expect(processor.deposit).toHaveBeenCalledWith(msg, "ftm")
  })
})
