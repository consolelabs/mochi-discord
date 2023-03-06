import defi from "adapters/defi"
import { MessageOptions } from "discord.js"
import { InternalError } from "errors"
import { RunResult } from "types/common"
import { composeButtonLink } from "ui/discord/button"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import * as tiputils from "utils/tip-bot"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
jest.mock("adapters/defi")

describe("deposit", () => {
  let msg = mockdc.cloneMessage()
  const dmMessage = mockdc.cloneDMMessage()
  const interaction = mockdc.cloneCommandInteraction()
  msg.content = "$deposit ftm"

  beforeEach(() => {
    msg = mockdc.cloneMessage()
    jest
      .spyOn(processor, "handleDepositExpiration")
      .mockImplementationOnce(() => null)
  })
  afterEach(() => jest.clearAllMocks())

  test("Success send DM to user - Using Message", async () => {
    msg.author.send = jest.fn().mockResolvedValueOnce(dmMessage)
    const res = {
      ok: true,
      data: {
        contract: {
          address: "0x123123123123",
          contract_address: "0x123123123123",
        },
      },
    }
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    defi.offchainTipBotAssignContract = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.deposit(msg, "ftm")
    const expected = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
            description: `${msg.author}, your deposit address has been sent to you. Check your DM!`,
            originalMsgAuthor: interaction.user,
          }),
        ],
        components: [composeButtonLink("See the DM", dmMessage.url)],
      },
    }
    // assertDescription(output as any, expected)
    assertRunResult(output as RunResult<MessageOptions>, expected)
  })

  test("Success send DM to user - Using CommandInteraction", async () => {
    interaction.user.send = jest.fn().mockResolvedValueOnce(dmMessage)
    const res = {
      ok: true,
      data: {
        contract: {
          address: "0x123123123123",
          contract_address: "0x123123123123",
        },
      },
    }
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    defi.offchainTipBotAssignContract = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.deposit(interaction, "ftm")
    const expected = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
            description: `${interaction.user}, your deposit address has been sent to you. Check your DM!`,
            originalMsgAuthor: interaction.user,
          }),
        ],
        components: [composeButtonLink("See the DM", dmMessage.url)],
      },
    }
    assertRunResult(output as RunResult<MessageOptions>, expected)
  })

  test("channel type === DM - Using Message", async () => {
    const mockDMMsg = mockdc.cloneDMMessage()
    mockDMMsg.author.send = jest.fn().mockResolvedValueOnce(dmMessage)
    const res = {
      ok: true,
      data: {
        contract: {
          address: "0x123123123123",
          contract_address: "0x123123123123",
        },
      },
    }
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
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
          contract_address: "0x123123123123",
        },
      },
    }
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
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
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    defi.offchainTipBotAssignContract = jest.fn().mockResolvedValueOnce(res)
    const description = `${getEmoji(
      "nekosad"
    )} Unfortunately, no **FTM** contract is available at this time. Please try again later`
    await expect(processor.deposit(msg, "ftm")).rejects.toThrow(
      new InternalError({
        msgOrInteraction: msg,
        description,
      })
    )
  })
})
