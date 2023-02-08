import { CommandInteraction, Message, MessageOptions } from "discord.js"
import { slashCommands } from "commands"
import { RunResult } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import {
  assertAuthor,
  assertDescription,
} from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { PREFIX } from "utils/constants"

describe("run", () => {
  let i: CommandInteraction
  const msg = {} as Message
  const watchlistCmd = slashCommands["watchlist"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("command run with enough args", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValue("view")
    const expected = composeEmbedMessage2(i, {
      author: [`${i.user.username}'s watchlist`, undefined],
    })
    expected.setDescription(
      `No items in your watchlist.Run \`${PREFIX}watchlist add\` to add one.`
    )
    jest
      .spyOn(processor, "composeSlashTokenWatchlist")
      .mockResolvedValueOnce({ embeds: [expected], files: [], components: [] })
    jest.spyOn(i, "fetchReply").mockResolvedValueOnce(msg)
    const output = (await watchlistCmd.run(i)) as RunResult<MessageOptions>
    expect(processor.composeSlashTokenWatchlist).toBeCalledWith(i, i.user.id)
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })
})
