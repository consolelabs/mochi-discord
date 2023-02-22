import { commands } from "commands"
import { Message, MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { assertRunResult } from "../../../../tests/assertions/discord"
jest.mock("adapters/config")

describe("run", () => {
  let msg: Message
  const commandKey = "nft"
  const commandAction = "config"
  if (
    !commands[commandKey] ||
    !commands[commandKey].actions ||
    !commands[commandKey].actions[commandAction]
  )
    return
  const nftCmd = commands[commandKey].actions[commandAction]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("nft add address chain", async () => {
    msg.content = `$nft integrate J9ts hNl8 1450 P0Vv`
    const expected = {
      messageOptions: {
        embeds: [
          new MessageEmbed({
            title: "Twitter sale config",
            description: "Successfully set configs.",
          }),
        ],
      },
    }
    jest.spyOn(processor, "handle").mockResolvedValueOnce(expected)
    const output = (await nftCmd.run(msg)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })
})
