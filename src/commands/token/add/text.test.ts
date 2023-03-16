import { commands } from "commands"
import { Message, MessageOptions } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { getSuccessEmbed } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { RunResult } from "types/common"

describe("run", () => {
  let msg: Message
  const tokenCmd = commands["token"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("command run with enough args", async () => {
    const token_name = "xsushi"
    const token_address = "0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272"
    const token_chain = "eth"
    msg.content = `$token add ${token_name} ${token_address} ${token_chain}`
    const expected = {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: `Your Token submission is successful`,
            description:
              "Thank you for submitting your token request!\nWe will review and update you on the approval status as quickly as possible.",
          }),
        ],
      },
    }
    jest.spyOn(processor, "process").mockResolvedValueOnce(expected)

    const output = await tokenCmd?.actions?.["add"].run(msg)

    expect(processor.process).toBeCalledWith(msg, {
      user_discord_id: msg.author.id,
      channel_id: msg.channelId,
      message_id: msg.id,
      token_name,
      token_address,
      token_chain,
    })
    assertRunResult(output as RunResult<MessageOptions>, expected)
  })
})
