import * as processor from "./processor"
import { getErrorEmbed, getSuccessEmbed } from "ui/discord/embed"
import {
  assertAuthor,
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import community from "adapters/community"
import { Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import { defaultEmojis } from "utils/common"
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
    const expected = getSuccessEmbed({
      title: "Channel set",
      description: `Mochi sent verify instructions to <#123123> channel`,
    })
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })

  test("runVerifySet exist channel", async () => {
    jest.spyOn(community, "getVerifyWalletChannel").mockResolvedValueOnce({
      ok: true,
      data: {
        verify_channel_id: "131313",
      },
    } as any)
    const output = (await processor.runVerifySet({
      msg,
      guildId: "121212",
    })) as RunResult<MessageOptions>
    const expected = getErrorEmbed({
      title: "Verified channel error",
      description: `The current verified channel is <#131313>.\n${defaultEmojis.POINT_RIGHT} You need to remove the existing configuration first via \`verify remove\`, before setting a new one.`,
    })
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
