import defi from "adapters/defi"
import * as processor from "./processor"
import { mockClient } from "../../../../tests/mocks"
import {
  Guild,
  SnowflakeUtil,
  Message,
  TextChannel,
  CommandInteraction,
} from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmojiURL, emojis } from "utils/common"
import { InternalError } from "errors"
jest.mock("adapters/defi")

describe("deposit", () => {
  const guild = Reflect.construct(Guild, [mockClient, {}])
  const userId = SnowflakeUtil.generate()
  const dmMessage = {
    url: "test",
  } as Message
  const msg = Reflect.construct(Message, [
    mockClient,
    {
      content: "$deposit ftm",
      author: {
        id: userId,
        username: "tester",
        discriminator: 1234,
      },
      id: SnowflakeUtil.generate(),
    },
    Reflect.construct(TextChannel, [
      guild,
      {
        client: mockClient,
        guild: guild,
        id: SnowflakeUtil.generate(),
      },
    ]),
  ]) as Message
  const interaction = {
    user: {
      id: SnowflakeUtil.generate(),
      send: jest.fn().mockResolvedValueOnce(dmMessage),
    },
  } as unknown as CommandInteraction

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

  test("channel type = DM", async () => {
    const interaction = {
      user: {
        id: SnowflakeUtil.generate(),
        send: jest.fn().mockResolvedValueOnce(dmMessage),
      },
      channel: {
        type: "DM",
      },
    } as unknown as CommandInteraction
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
