import { commands } from "commands"
import { Message } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"

describe("run", () => {
  let msg: Message
  const tokenCmd = commands["token"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("command run with enough args", async () => {
    msg.content = "$token remove"
    const expected = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "Need action",
            description:
              "Select to remove one of the following tokens from your server.",
          }),
        ],
        components: [undefined, undefined],
      },
      interactionOptions: {
        handler: () => null,
      },
    }
    jest
      .spyOn(processor, "handleTokenRemove")
      .mockResolvedValueOnce(expected as any)
    const output = await tokenCmd?.actions?.["remove"].run(msg)
    expect(processor.handleTokenRemove).toBeCalledWith(
      msg.guildId,
      msg.author.id
    )
    assertRunResult(output as any, expected as any)
  })
})
