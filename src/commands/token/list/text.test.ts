import { commands } from "commands"
import { Message } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"

describe("run", () => {
  let msg: Message
  const tokenCmd = commands["token"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("command run with enough args", async () => {
    msg.content = "$token list"
    jest.spyOn(processor, "handleTokenList").mockResolvedValueOnce({} as any)
    await tokenCmd?.actions?.["list"].run(msg)
    expect(processor.handleTokenList).toBeCalledWith(msg.guildId)
  })
})
