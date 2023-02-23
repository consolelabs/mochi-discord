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
    msg.content = "$token add"
    const expected = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "Need action",
            description:
              "Select to add one of the following tokens to your server.",
          }),
        ],
        components: [undefined, undefined],
      },
      interactionOptions: {
        handler: () => null,
      },
    }
    jest
      .spyOn(processor, "handleTokenAdd")
      .mockResolvedValueOnce(expected as any)
    const output = await tokenCmd?.actions?.["add"].run(msg)
    expect(processor.handleTokenAdd).toBeCalledWith(
      msg,
      msg.guildId,
      msg.author.id
    )
    assertRunResult(output as any, expected as any)
  })
})
