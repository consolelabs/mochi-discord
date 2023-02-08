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
    i.options.getSubcommand = jest.fn().mockReturnValue("add")
    i.options.getString = jest.fn().mockReturnValueOnce("ftm")
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
    const output = (await watchlistCmd.run(i)) as RunResult<MessageOptions>
    const args = {
      interaction: i,
      symbols: ["ftm"],
      originSymbols: ["ftm"],
      userId: i.user.id,
    }
    expect(processor.viewWatchlist).toBeCalledWith(args)
    assertAuthor(output, expected.messageOptions.embeds[0])
    assertDescription(output, expected.messageOptions.embeds[0])
  })
})
