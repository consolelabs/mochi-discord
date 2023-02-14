import defi from "adapters/defi"
import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmojiURL, emojis } from "utils/common"
import { InternalError } from "errors"
import mockdc from "../../../../tests/mocks/discord"
jest.mock("adapters/defi")

describe("deposit", () => {
  const msg = mockdc.cloneMessage()
  const dmMessage = mockdc.cloneDMMessage()
  const interaction = mockdc.cloneCommandInteraction()
  msg.content = "$deposit ftm"

  afterEach(() => jest.clearAllMocks())

  test("Success send DM to user - Using Message", async () => {
    msg.author.send = jest.fn().mockResolvedValueOnce(dmMessage)
    const res = {
      ok: true,
      data: {
        contract: {
          address: "0x123123123123",
        },
      },
    }
    defi.offchainTipBotAssignContract = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.deposit(msg, "ftm")
    const expected = composeEmbedMessage(null, {
      author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
      description: `${msg.author}, your deposit address has been sent to you. Check your DM!`,
    })
    expect(output?.messageOptions.embeds[0].description).toStrictEqual(
      expected.description
    )
  })

  test("Success send DM to user - Using CommandInteraction", async () => {
    interaction.user.send = jest.fn().mockResolvedValueOnce(dmMessage)
    const res = {
      ok: true,
      data: {
        contract: {
          address: "0x123123123123",
        },
      },
    }
    defi.offchainTipBotAssignContract = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.deposit(interaction, "ftm")
    const expected = composeEmbedMessage(null, {
      author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
      description: `${interaction.user}, your deposit address has been sent to you. Check your DM!`,
    })
    expect(output?.messageOptions.embeds[0].description).toStrictEqual(
      expected.description
    )
  })

  test("channel type === DM - Using Message", async () => {
    const mockDMMsg = mockdc.cloneDMMessage()
    mockDMMsg.author.send = jest.fn().mockResolvedValueOnce(dmMessage)
    const res = {
      ok: true,
      data: {
        contract: {
          address: "0x123123123123",
        },
      },
    }
    defi.offchainTipBotAssignContract = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.deposit(mockDMMsg, "ftm")
    expect(output).toBeFalsy()
  })

  test("channel type === DM - Using CommandInteraction", async () => {
    const mockDMCommandInteraction = mockdc.cloneDMCommandInteraction()
    mockDMCommandInteraction.user.send = jest
      .fn()
      .mockResolvedValueOnce(dmMessage)
    const res = {
      ok: true,
      data: {
        contract: {
          address: "0x123123123123",
        },
      },
    }
    defi.offchainTipBotAssignContract = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.deposit(mockDMCommandInteraction, "ftm")
    expect(output).toBeFalsy()
  })

  test("contract not found or already assigned error", async () => {
    const res = {
      ok: false,
      data: null,
      error: "contract not found or already assigned",
      log: "",
      curl: "",
      status: 404,
    }
    defi.offchainTipBotAssignContract = jest.fn().mockResolvedValueOnce(res)
    // const expectedDesc = `${getEmoji(
    //   "nekosad"
    // )} Unfortunately, no **FTM** contract is available at this time. Please try again later`
    await expect(processor.deposit(msg, "ftm")).rejects.toThrow(InternalError)
  })
})
