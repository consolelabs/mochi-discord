import { commands } from "commands"
import { Message } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { CommandArgumentError } from "errors"

describe("run", () => {
  let msg: Message
  const tokenCmd = commands["token"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("command args error", async () => {
    msg.content = "$token info"
    await expect(tokenCmd?.actions?.["info"].run(msg)).rejects.toThrow(
      CommandArgumentError
    )
  })

  test("command run with enough args", async () => {
    msg.content = "$token info ftm"
    jest.spyOn(processor, "handleTokenInfo").mockResolvedValueOnce({} as any)
    await tokenCmd?.actions?.["info"].run(msg)
    expect(processor.handleTokenInfo).toBeCalledWith(msg, "ftm")
  })
})
