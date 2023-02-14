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
    msg.content = "$token default"
    await expect(tokenCmd?.actions?.["default"].run(msg)).rejects.toThrow(
      CommandArgumentError
    )
  })

  test("command run with enough args", async () => {
    msg.content = "$token default ftm"
    jest.spyOn(processor, "handleTokenDefault").mockResolvedValueOnce({} as any)
    await tokenCmd?.actions?.["default"].run(msg)
    expect(processor.handleTokenDefault).toBeCalledWith(msg, "ftm")
  })
})
