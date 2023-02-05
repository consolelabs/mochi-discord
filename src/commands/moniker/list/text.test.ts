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
  const monikerCmd = commands["moniker"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("guild not found", async () => {
    msg.guildId = null
    await expect(monikerCmd.run(msg)).rejects.toThrow(GuildIdNotFoundError)
  })

  test("get moniker list default successfully", async () => {
    msg.content = `$moniker list`
    const expected = new MessageEmbed({
      title: `${getEmoji("bucket_cash")} Moniker List`,
    })
    expected
      .addFields({
        name: "\u200B",
        value: `This is our default moniker! ${getEmoji(
          "boo"
        )}\n👉 To set yours, run $monikers set \`<moniker> <amount_token> <token>\`!`,
      })
      .addFields(
        { name: "Moniker", value: "moniker", inline: true },
        { name: "Value", value: "value", inline: true }
      )
    jest.spyOn(processor, "handleMonikerList").mockResolvedValueOnce({
      embeds: [expected],
    })
    const output = (await monikerCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("get moniker list successfully", async () => {
    msg.content = `$moniker list`
    const expected = new MessageEmbed({
      title: `${getEmoji("bucket_cash")} Moniker List`,
    })
    expected
      .addFields({
        name: "\u200B",
        value:
          "👉To set more monikers, run `$monikers set <moniker> <amount_token> <token>`!\n👉 For example, try `$monikers set tea 1 BUTT`",
      })
      .addFields(
        { name: "Moniker", value: "moniker", inline: true },
        { name: "Value", value: "value", inline: true }
      )
    jest.spyOn(processor, "handleMonikerList").mockResolvedValueOnce({
      embeds: [expected],
    })
    const output = (await monikerCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
