import { commands } from "commands"
import { Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import {
  assertAuthor,
  assertDescription,
} from "../../../../tests/assertions/discord"
import { getSuccessEmbed } from "ui/discord/embed"
import * as defiUtil from "utils/defi"
jest.mock("adapters/defi")
jest.mock("utils/defi")

describe("run", () => {
  let msg: Message
  const watchlistCmd = commands["watchlist"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("run with proper args", async () => {
    msg.content = "$wl remove ftm"
    const expected = {
      messageOptions: {
        embeds: [getSuccessEmbed({})],
        components: [],
      },
    }
    jest.spyOn(defiUtil, "parseTickerQuery").mockReturnValueOnce({
      isFiat: false,
      base: "ftm",
      isCompare: false,
      target: "",
    })
    jest
      .spyOn(processor, "removeWatchlistToken")
      .mockResolvedValueOnce(expected)
    const output = (await watchlistCmd?.actions?.["remove"]?.run(
      msg
    )) as RunResult<MessageOptions>
    const args = {
      msgOrInteraction: msg,
      symbol: "ftm",
      userId: msg.author.id,
    }
    expect(processor.removeWatchlistToken).toBeCalledWith(args)
    assertAuthor(output, expected.messageOptions.embeds[0])
    assertDescription(output, expected.messageOptions.embeds[0])
  })
})
