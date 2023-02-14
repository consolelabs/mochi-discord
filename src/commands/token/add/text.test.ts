import { commands } from "commands"
import { Message } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"

describe("run", () => {
  let msg: Message
  const tokenCmd = commands["token"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("command run with enough args", async () => {
    msg.content = "$token add"
    jest.spyOn(processor, "handleTokenAdd").mockResolvedValueOnce({} as any)
    await tokenCmd?.actions?.["add"].run(msg)
    expect(processor.handleTokenAdd).toBeCalledWith(
      msg,
      msg.guildId,
      msg.author.id
    )
  })
})
