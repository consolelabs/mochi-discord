import { CommandInteraction, MessageOptions } from "discord.js"
import { slashCommands } from "commands"
import { RunResult } from "types/common"
import { getSuccessEmbed } from "ui/discord/embed"
import {
  assertAuthor,
  assertDescription,
} from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"

describe("run", () => {
  let i: CommandInteraction
  const watchlistCmd = slashCommands["watchlist"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("command run with enough args", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValue("remove-nft")
    i.options.getString = jest.fn().mockReturnValueOnce("rabby")
    const expected = {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Successfully remove!",
            description:
              "**RABBY** has been removed from your watchlist successfully!",
          }),
        ],
        components: [],
      },
    }
    jest
      .spyOn(processor, "removeWatchlistNftCollection")
      .mockResolvedValueOnce(expected)
    const output = (await watchlistCmd.run(i)) as RunResult<MessageOptions>
    const args = {
      msgOrInteraction: i,
      symbol: "rabby",
      userId: i.user.id,
    }
    expect(processor.removeWatchlistNftCollection).toBeCalledWith(args)
    assertAuthor(output, expected.messageOptions.embeds[0])
    assertDescription(output, expected.messageOptions.embeds[0])
  })
})
