import { Message, MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { assertRunResult } from "../../../../tests/assertions/discord"
import nft from ".."
jest.mock("adapters/community")

describe("run", () => {
  let msg: Message
  const commandAction = "add"
  if (
    !nft.textCmd ||
    !nft.textCmd.actions ||
    !nft.textCmd.actions[commandAction]
  )
    return
  const nftCmd = nft.textCmd.actions[commandAction]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("nft add address chain", async () => {
    msg.content = `nft add 0x51081a152db09d3FfF75807329A3A8b538eCf73b ftm`
    const expected = {
      messageOptions: {
        embeds: [
          new MessageEmbed({
            title: "NFT",
            description: "Successfully add new collection to queue",
          }),
        ],
      },
    }
    jest
      .spyOn(processor, "executeNftAddCommand")
      .mockResolvedValueOnce(expected)
    const output = (await nftCmd.run(msg)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })

  test("nft add link", async () => {
    msg.content = `nft add https://opensea.io/collection/tykes`
    const expected = {
      messageOptions: {
        embeds: [
          new MessageEmbed({
            title: "NFT",
            description: "Successfully add new collection to queue",
          }),
        ],
      },
    }
    jest
      .spyOn(processor, "executeNftAddCommand")
      .mockResolvedValueOnce(expected)
    const output = (await nftCmd.run(msg)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })

  test("nft already added", async () => {
    msg.content = `nft add https://opensea.io/collection/tykes`
    const expected = {
      messageOptions: {
        embeds: [
          new MessageEmbed({
            title: "NFT",
            description: "Already added. Nft is done with sync",
          }),
        ],
      },
    }
    jest
      .spyOn(processor, "executeNftAddCommand")
      .mockResolvedValueOnce(expected)
    const output = (await nftCmd.run(msg)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })

  test("nft add error", async () => {
    msg.content = `nft add 0x2345 eft`
    const expected = {
      messageOptions: {
        embeds: [
          new MessageEmbed({
            title: "NFT",
            description: "Cannot found metadata for this collection",
          }),
        ],
      },
    }
    jest
      .spyOn(processor, "executeNftAddCommand")
      .mockResolvedValueOnce(expected)
    const output = (await nftCmd.run(msg)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })
})
