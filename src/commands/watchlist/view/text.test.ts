import { commands } from "commands"
import { Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { defaultEmojis } from "utils/common"
import { PREFIX } from "utils/constants"
jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message
  const watchlistCmd = commands["watchlist"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("run with proper args", async () => {
    const expected = composeEmbedMessage(msg, {
      author: [
        `${msg.author.username}'s watchlist`,
        msg.author.displayAvatarURL({ format: "png" }),
      ],
      description: `_All information are supported by Coingecko_\n\n${defaultEmojis.POINT_RIGHT} Choose a token supported by [Coingecko](https://www.coingecko.com/) to add to the list.\n${defaultEmojis.POINT_RIGHT} Add token to track by \`$wl add <symbol>\`.`,
    })
    expected.setDescription(
      `No items in your watchlist.Run \`${PREFIX}wl add\` to add one.`
    )
    jest
      .spyOn(processor, "composeTokenWatchlist")
      .mockResolvedValueOnce({ embeds: [expected], files: [], components: [] })
    jest.spyOn(msg, "reply").mockResolvedValueOnce(msg)
    const output = (await watchlistCmd?.actions?.["view"]?.run(
      msg
    )) as RunResult<MessageOptions>
    expect(processor.composeTokenWatchlist).toBeCalledWith(msg, msg.author.id)
    expect(output).toBeFalsy()
  })
})
