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
  const commandKey = "moniker"
  const commandAction = "set"
  if (
    !commands[commandKey] ||
    !commands[commandKey].actions ||
    !commands[commandKey].actions[commandAction]
  )
    return
  const monikerCmd = commands[commandKey].actions[commandAction]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("guild not found", async () => {
    msg.guildId = null
    await expect(monikerCmd.run(msg)).rejects.toThrow(GuildIdNotFoundError)
  })

  test("set moniker successfully", async () => {
    msg.content = `$moniker set coffee 0.01 cake`
    const expected = new MessageEmbed({
      title: `${getEmoji("approve")} Moniker successfully set`,
      description: `1 cafe is set as 0.01 **ETH**. To tip your friend moniker, use $tip <@users> <amount> <moniker> . ${getEmoji(
        "bucket_cash"
      )}`,
    })
    const output = (await monikerCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("set moniker successfully 2", async () => {
    msg.content = `$moniker set banh mi 0.01`
    const expected = new MessageEmbed({
      title: `${getEmoji("approve")} Moniker successfully set`,
      description: `1 **banh mi** is set as 0.01 ETH. To tip your friend moniker, use $tip <@users> <amount> <moniker> . ${getEmoji(
        "bucket_cash"
      )}`,
    })
    const output = (await monikerCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
