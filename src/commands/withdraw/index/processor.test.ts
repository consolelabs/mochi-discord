import {
  SnowflakeUtil,
  Message,
  Collection,
  TextChannel,
  Guild,
  CommandInteraction,
} from "discord.js"
import * as processor from "./processor"
import { mockClient } from "../../../../tests/mocks"
import Defi from "adapters/defi"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { APIError } from "errors"
jest.mock("adapters/defi")
jest.mock("utils/common")

describe("getDestinationAddress", () => {
  const guild = Reflect.construct(Guild, [mockClient, {}])
  const userId = SnowflakeUtil.generate()
  const mockedCollectedMessage = {
    id: SnowflakeUtil.generate(),
    content: "0xE409E073eE7474C381BFD9b3f88098499123123",
  } as unknown as Message
  const mockedCollected = new Collection<string, Message<boolean>>()
  mockedCollected.set("test", mockedCollectedMessage)

  const mockedDm = {
    id: SnowflakeUtil.generate(),
    channel: {
      awaitMessages: jest.fn().mockResolvedValue(mockedCollected),
    },
  } as unknown as Message

  test("getSuccess using Message", async () => {
    const msg = Reflect.construct(Message, [
      mockClient,
      {
        content: "$wd all ftm",
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
    ])
    const output = await processor.getDestinationAddress(msg, mockedDm)
    expect(output).toEqual("0xE409E073eE7474C381BFD9b3f88098499123123")
  })

  test("getSuccess using Message", async () => {
    const interaction = {
      id: SnowflakeUtil.generate(),
      user: {
        id: SnowflakeUtil.generate(),
      },
    } as CommandInteraction
    const output = await processor.getDestinationAddress(interaction, mockedDm)
    expect(output).toEqual("0xE409E073eE7474C381BFD9b3f88098499123123")
  })
})

describe("withdraw", () => {
  const guild = Reflect.construct(Guild, [mockClient, {}])
  const userId = SnowflakeUtil.generate()
  const msg = Reflect.construct(Message, [
    mockClient,
    {
      content: "$wd 1 ftm",
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
  msg.author.send = jest.fn().mockResolvedValueOnce(undefined)

  afterEach(() => jest.clearAllMocks())

  test("msg.author.send should be called once", async () => {
    const args = [
      "withdraw",
      "1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    const mockedResponse = {
      ok: true,
      data: {
        amount: 1,
        tx_hash: "0x3b47c97f3f7bf3b462eba7b2b546f927a3b59be7103ff0439123123",
        tx_url:
          "https://ftmscan.com/tx/0x3b47c97f3f7bf3b462eba7b2b546f927a3b59be7103ff0439123123",
      },
    }
    Defi.getInsuffientBalanceEmbed = jest.fn().mockResolvedValueOnce(null)
    Defi.offchainDiscordWithdraw = jest
      .fn()
      .mockResolvedValueOnce(mockedResponse)
    await processor.withdraw(msg, args)
    expect(msg.author.send).toHaveBeenCalledTimes(1)
  })

  test("insufficient balance", async () => {
    const args = [
      "withdraw",
      "1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    Defi.getInsuffientBalanceEmbed = jest.fn().mockResolvedValueOnce({})
    Defi.offchainDiscordWithdraw = jest.fn()
    await processor.withdraw(msg, args)
    expect(Defi.offchainDiscordWithdraw).not.toHaveBeenCalled()
  })

  test("invalid amount", async () => {
    const args = [
      "withdraw",
      "-1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    await expect(processor.withdraw(msg, args)).rejects.toThrow(
      DiscordWalletTransferError
    )
  })
})

describe("withdrawSlash", () => {
  const interaction = {
    user: {
      send: jest.fn(),
    },
  } as unknown as CommandInteraction

  afterEach(() => jest.clearAllMocks())

  test("interaction.user.send should be called once", async () => {
    const args = [
      "withdraw",
      "1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    const mockedResponse = {
      ok: true,
      data: {
        amount: 1,
        tx_hash: "0x3b47c97f3f7bf3b462eba7b2b546f927a3b59be7103ff0439123123",
        tx_url:
          "https://ftmscan.com/tx/0x3b47c97f3f7bf3b462eba7b2b546f927a3b59be7103ff0439123123",
      },
    }
    Defi.getInsuffientBalanceEmbed = jest.fn().mockResolvedValueOnce(null)
    Defi.offchainDiscordWithdraw = jest
      .fn()
      .mockResolvedValueOnce(mockedResponse)
    await processor.withdrawSlash(interaction, args[1], args[2], args[3])
    expect(interaction.user.send).toHaveBeenCalledTimes(1)
  })

  test("withdrawal failed due to api error", async () => {
    const args = [
      "withdraw",
      "1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    Defi.offchainDiscordWithdraw = jest.fn().mockResolvedValueOnce({
      ok: false,
      data: null,
    })
    await expect(
      processor.withdrawSlash(interaction, args[1], args[2], args[3])
    ).rejects.toThrow(APIError)
  })
})
