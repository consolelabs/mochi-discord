import { commands } from "commands"
import { Message } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { assertRunResult } from "../../../../tests/assertions/discord"

describe("run", () => {
  let msg: Message
  const tokenCmd = commands["token"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("command run with enough args", async () => {
    msg.content = "$token list"
    const expected = {
      messageOptions: {
        embeds: [
          {
            color: "#77b255",
            title: ":dollar: Tokens list",
            fields: [],
          },
        ],
      },
    }
    jest
      .spyOn(processor, "handleTokenList")
      .mockResolvedValueOnce(expected as any)
    const output = await tokenCmd?.actions?.["list"].run(msg)
    expect(processor.handleTokenList).toBeCalled()
    assertRunResult(output as any, expected as any)
  })
})
