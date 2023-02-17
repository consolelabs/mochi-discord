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
jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message
  const watchlistCmd = commands["watchlist"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("run with proper args", async () => {
    msg.content = "$wl add ftm"
    const expected = {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Successfully set!",
            description:
              "**FTM** has been added successfully! Track it by `$watchlist view`.",
          }),
        ],
        components: [],
      },
    }
    jest.spyOn(processor, "viewWatchlist").mockResolvedValueOnce(expected)
    const output = (await watchlistCmd?.actions?.["add"]?.run(
      msg
    )) as RunResult<MessageOptions>
    const args = {
      msg,
      symbols: ["ftm"],
      originSymbols: ["ftm"],
      userId: msg.author.id,
    }
    expect(processor.viewWatchlist).toBeCalledWith(args)
    assertAuthor(output, expected.messageOptions.embeds[0])
    assertDescription(output, expected.messageOptions.embeds[0])
  })
})
