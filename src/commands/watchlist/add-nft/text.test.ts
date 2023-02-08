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
    msg.content = "$wl add-nft rabby"
    const expected = {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Successfully set!",
            description:
              "**RABBY** has been added successfully! To see your watchlist use `$watchlist view`.",
          }),
        ],
        components: [],
      },
    }
    jest
      .spyOn(processor, "addWatchlistNftCollection")
      .mockResolvedValueOnce(expected)
    const output = (await watchlistCmd?.actions?.["add-nft"]?.run(
      msg
    )) as RunResult<MessageOptions>
    const args = {
      msgOrInteraction: msg,
      symbol: "rabby",
      userId: msg.author.id,
    }
    expect(processor.addWatchlistNftCollection).toBeCalledWith(args)
    assertAuthor(output, expected.messageOptions.embeds[0])
    assertDescription(output, expected.messageOptions.embeds[0])
  })
})
