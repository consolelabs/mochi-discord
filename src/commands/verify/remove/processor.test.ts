import * as processor from "./processor"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import community from "adapters/community"
jest.mock("adapters/community")

describe("runVerify", () => {
  afterEach(() => jest.clearAllMocks())

  test("runVerify successfully", async () => {
    jest.spyOn(community, "getVerifyWalletChannel").mockResolvedValueOnce({
      ok: true,
      data: {},
    } as any)
    jest.spyOn(community, "deleteVerifyWalletChannel").mockResolvedValueOnce({
      ok: true,
    } as any)
    const output = await processor.runVerifyRemove("123456")
    const expected = {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Channel removed",
            description: `Instruction message removed\n**NOTE**: not having a channel for verification will limit the capabilities of Mochi, we suggest you set one by running \`$verify set #<channel_name>\``,
          }),
        ],
      },
    }
    assertRunResult(output, expected)
  })

  test("runVerify api empty", async () => {
    jest.spyOn(community, "getVerifyWalletChannel").mockResolvedValueOnce({
      ok: true,
      data: null,
    } as any)
    const output = await processor.runVerifyRemove("123456")
    const expected = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No config found",
            description: "No verify channel to remove",
          }),
        ],
      },
    }
    assertRunResult(output, expected)
  })
})
