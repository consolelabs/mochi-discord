import { commands } from "commands"
import { Message, MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import { ADD_COLLECTION_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
jest.mock("adapters/community")

describe("run", () => {
  let msg: Message
  const commandKey = "nft"
  const commandAction = "add"
  if (
    !commands[commandKey] ||
    !commands[commandKey].actions ||
    !commands[commandKey].actions[commandAction]
  )
    return
  const nftCmd = commands[commandKey].actions[commandAction]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("nft add wrong", async () => {
    msg.content = `$nft add sth`
    const expected = composeEmbedMessage(null, {
      usage: `To add a collection on EVM chain (ETH and FTM), use:\n${PREFIX}nft add <address> <chain_id/chain_symbol>\n\nTo add a collection on Solana:\n$nft add <collection_id> <chain_id/chain_symbol>`,
      examples: `${PREFIX}nft add 0x51081a152db09d3FfF75807329A3A8b538eCf73b ftm\n${PREFIX}mochi add 0xFBde54764f51415CB0E00765eA4383bc90EDCCE8 5\n${PREFIX}nft add https://opensea.io/collection/tykes`,
      document: ADD_COLLECTION_GITBOOK,
    })
    const output = (await nftCmd.run(msg)) as RunResult<MessageOptions>
    assertDescription(output, expected)
  })

  test("nft add address chain", async () => {
    msg.content = `nft add 0x51081a152db09d3FfF75807329A3A8b538eCf73b ftm`
    const expected = new MessageEmbed({
      title: "NFT",
      description: "Successfully add new collection to queue",
    })
    jest.spyOn(processor, "executeNftAddCommand").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await nftCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("nft add link", async () => {
    msg.content = `nft add https://opensea.io/collection/tykes`
    const expected = new MessageEmbed({
      title: "NFT",
      description: "Successfully add new collection to queue",
    })
    jest.spyOn(processor, "executeNftAddCommand").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await nftCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("nft already added", async () => {
    msg.content = `nft add https://opensea.io/collection/tykes`
    const expected = new MessageEmbed({
      title: "NFT",
      description: "Already added. Nft is done with sync",
    })
    jest.spyOn(processor, "executeNftAddCommand").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await nftCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("nft add error", async () => {
    msg.content = `nft add 0x2345 eft`
    const expected = new MessageEmbed({
      title: "NFT",
      description: "Cannot found metadata for this collection",
    })
    jest.spyOn(processor, "executeNftAddCommand").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await nftCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
