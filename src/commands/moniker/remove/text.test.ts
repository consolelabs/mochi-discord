import { commands } from "commands"
import { Message, MessageEmbed, MessageOptions } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { RunResult } from "types/common"
import { getEmoji } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message
  const commandKey = "moniker"
  const commandAction = "remove"
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

  test("remove moniker successfully", async () => {
    msg.content = `$moniker remove cafe`
    const expected = new MessageEmbed({
      title: `${getEmoji("approve")} Successfully removed`,
      description: `**cafe** is removed. To set the new one, run $moniker set <moniker> <amount_token> <token>. <a:bucket_cash:933020342035820604>`,
    })

    jest.spyOn(processor, "handleRemoveMoniker").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })

    const output = (await monikerCmd.run(msg)) as RunResult<MessageOptions>

    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
