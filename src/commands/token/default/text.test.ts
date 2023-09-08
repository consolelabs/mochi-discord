import { commands } from "commands"
import { Message } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { CommandArgumentError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"

describe("run", () => {
  let msg: Message
  const tokenCmd = commands["token"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("command args error", async () => {
    msg.content = "$token default"
    await expect(tokenCmd?.actions?.["default"].run(msg)).rejects.toThrow(
      CommandArgumentError,
    )
  })

  test("command run with enough args", async () => {
    msg.content = "$token default ftm"
    const expectedEmbed = {
      embeds: [
        composeEmbedMessage(null, {
          description: `Successfully set **FTM** as default token for server`,
        }),
      ],
    }
    jest
      .spyOn(processor, "handleTokenDefault")
      .mockResolvedValueOnce(expectedEmbed)
    const output = await tokenCmd?.actions?.["default"].run(msg)
    expect(processor.handleTokenDefault).toBeCalledWith(msg, "ftm")
    assertRunResult(output as any, { messageOptions: expectedEmbed })
  })
})
