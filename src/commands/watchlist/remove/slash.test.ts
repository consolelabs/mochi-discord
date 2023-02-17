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
    i.options.getSubcommand = jest.fn().mockReturnValue("remove")
    i.options.getString = jest.fn().mockReturnValueOnce("ftm")
    const expected = {
      messageOptions: {
        embeds: [getSuccessEmbed({})],
      },
    }
    jest
      .spyOn(processor, "removeWatchlistToken")
      .mockResolvedValueOnce(expected)
    const output = (await watchlistCmd.run(i)) as RunResult<MessageOptions>
    const args = {
      msgOrInteraction: i,
      symbol: "ftm",
      userId: i.user.id,
    }
    expect(processor.removeWatchlistToken).toBeCalledWith(args)
    assertAuthor(output, expected.messageOptions.embeds[0])
    assertDescription(output, expected.messageOptions.embeds[0])
  })
})
