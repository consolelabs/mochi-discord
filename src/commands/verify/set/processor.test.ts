import * as processor from "./processor"
import { getSuccessEmbed } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import community from "adapters/community"
import { Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
jest.mock("adapters/community")

describe("runVerify", () => {
  let msg: Message

  beforeEach(() => (msg = mockdc.cloneMessage()))

  afterEach(() => jest.clearAllMocks())

  test("runVerifySet successfully", async () => {
    msg.content = "$verify set <#123123> <@&123456>"
    jest.spyOn(community, "getVerifyWalletChannel").mockResolvedValueOnce({
      ok: true,
      data: {},
    } as any)
    jest.spyOn(community, "createVerifyWalletChannel").mockResolvedValueOnce({
      ok: true,
    } as any)
    const output = (await processor.runVerifySet({
      msg,
      guildId: "121212",
    })) as RunResult<MessageOptions>
    const expected = {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Channel set",
            description: `Mochi sent verify instructions to <#123123> channel. In addition, user will be assigned role <@&123456> upon successful verification`,
          }),
        ],
      },
    }
    assertRunResult(output, expected)
  })
})
