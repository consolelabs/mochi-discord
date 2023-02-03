import { commands } from "commands"
import { Message, MessageEmbed, MessageOptions } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { RunResult } from "types/common"
import { getEmoji } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message
  const monikerCmd = commands["moniker"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("guild not found", async () => {
    msg.guildId = null
    await expect(monikerCmd.run(msg)).rejects.toThrow(GuildIdNotFoundError)
  })

  test("remove missing moniker name", async () => {
    msg.content = `$moniker remove`
    const expected = new MessageEmbed({
      title: "Remove a moniker configuration",
    })
    const output = (await monikerCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
  })

  test("remove moniker successfully", async () => {
    msg.content = `$moniker remove cafe`
    const expected = new MessageEmbed({
      title: `${getEmoji("approve")} Successfully removed`,
      description: `**cafe**  is removed. To set the new one, run $moniker set <moniker> <amount_token> <token>. ${getEmoji(
        "bucket_cash"
      )}`,
    })
    const output = (await monikerCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
