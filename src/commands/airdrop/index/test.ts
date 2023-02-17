import defi from "adapters/defi"
import { commands } from "commands"
import Discord, { MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { mockClient } from "../../../../tests/mocks"
import * as processor from "./processor"

jest.mock("adapters/defi")
const commandKey = "airdrop"

describe("airdrop", () => {
  const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
  const userId = Discord.SnowflakeUtil.generate()
  if (!commands[commandKey]) return
  const command = commands[commandKey]

  test("airdrop", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$airdrop 1 cake",
        author: {
          id: userId,
          username: "tester",
          discriminator: 1234,
        },
        id: Discord.SnowflakeUtil.generate(),
        guild_id: Discord.SnowflakeUtil.generate(),
        channel_id: Discord.SnowflakeUtil.generate(),
      },
      Reflect.construct(Discord.TextChannel, [
        guild,
        {
          client: mockClient,
          guild: guild,
          id: Discord.SnowflakeUtil.generate(),
        },
      ]),
    ])
    const balResp = {
      ok: true,
      data: [
        {
          balances: 10,
          balances_in_usd: 20.5,
          id: "pancake-swap",
          name: "Panswap Cake",
          rate_in_usd: 2.05,
          symbol: "CAKE",
        },
        {
          balances: 5,
          balances_in_usd: 10,
          id: "fantom",
          name: "Fantom",
          rate_in_usd: 2,
          symbol: "FTM",
        },
      ],
    }
    const payload = {
      sender: userId,
      recipients: [],
      guildId: msg.guild_id,
      channelId: msg.channel_id,
      amount: 1,
      token: "CAKE",
      each: false,
      all: false,
      transferType: "airdrop",
      duration: 180,
      fullCommand: "",
      opts: { duration: 180, maxEntries: 0 },
    }
    jest.spyOn(processor, "getAirdropPayload").mockResolvedValueOnce(payload)
    // processor.getAirdropPayload = jest.fn().mockResolvedValueOnce(payload)
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(balResp)
    const expected = composeEmbedMessage(null, {
      title: "<:airdrop:1058301255933501491> Confirm airdrop",
      description:
        "Are you sure you want to spend <:cake:972205674371117126> **1 CAKE** (\u2248 $2.05) on this airdrop?",
    }).addFields([
      {
        name: "Total reward",
        value: "<:cake:972205674371117126> **1 CAKE** (\u2248 $2.05)",
        inline: true,
      },
      {
        name: "Run time",
        value: "3m",
        inline: true,
      },
      {
        name: "Max entries",
        value: "-",
        inline: true,
      },
    ])
    const output = await command.run(msg)
    expect(processor.getAirdropPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainGetUserBalances).toHaveBeenCalledTimes(1)
    expect(expected.title).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
    expect(expected.fields).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].fields
    )
  })

  // test("airdrop with time", async () => {
  //   const msg = Reflect.construct(Discord.Message, [
  //     mockClient,
  //     {
  //       content: "$airdrop 1 cake in 120s",
  //       author: {
  //         id: userId,
  //         username: "tester",
  //         discriminator: 1234,
  //       },
  //       id: Discord.SnowflakeUtil.generate(),
  //       guild_id: Discord.SnowflakeUtil.generate(),
  //       channel_id: Discord.SnowflakeUtil.generate(),
  //     },
  //     Reflect.construct(Discord.TextChannel, [
  //       guild,
  //       {
  //         client: mockClient,
  //         guild: guild,
  //         id: Discord.SnowflakeUtil.generate(),
  //       },
  //     ]),
  //   ])
  //   const balResp = {
  //     ok: true,
  //     data: [
  //       {
  //         balances: 10,
  //         balances_in_usd: 20.5,
  //         id: "pancake-swap",
  //         name: "Panswap Cake",
  //         rate_in_usd: 2.05,
  //         symbol: "CAKE",
  //       },
  //       {
  //         balances: 5,
  //         balances_in_usd: 10,
  //         id: "fantom",
  //         name: "Fantom",
  //         rate_in_usd: 2,
  //         symbol: "FTM",
  //       },
  //     ],
  //   }
  //   const payload = {
  //     sender: userId,
  //     recipients: [],
  //     guildId: msg.guild_id,
  //     channelId: msg.channel_id,
  //     amount: 1,
  //     token: "CAKE",
  //     each: false,
  //     all: false,
  //     transferType: "airdrop",
  //     duration: 120,
  //     fullCommand: "",
  //     opts: { duration: 120, maxEntries: 0 },
  //   }
  //   defi.getAirdropPayload = jest.fn().mockResolvedValueOnce(payload)
  //   defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(balResp)
  //   const expected = composeEmbedMessage(null, {
  //     title: ":airplane: Confirm airdrop",
  //     description:
  //       "Are you sure you want to spend <:cake:972205674371117126> **1 CAKE** (\u2248 $2.05) on this airdrop?",
  //   }).addFields([
  //     {
  //       name: "Total reward",
  //       value: "<:cake:972205674371117126> **1 CAKE** (\u2248 $2.05)",
  //       inline: true,
  //     },
  //     {
  //       name: "Run time",
  //       value: "2m",
  //       inline: true,
  //     },
  //     {
  //       name: "Max entries",
  //       value: "-",
  //       inline: true,
  //     },
  //   ])
  //   const output = await command.run(msg)
  //   expect(defi.getAirdropPayload).toHaveBeenCalledTimes(1)
  //   expect(defi.offchainGetUserBalances).toHaveBeenCalledTimes(1)
  //   expect(expected.title).toStrictEqual(
  //     (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
  //   )
  //   expect(expected.description).toStrictEqual(
  //     (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
  //       .description
  //   )
  //   expect(expected.fields).toStrictEqual(
  //     (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].fields
  //   )
  // })

  // test("airdrop with entries", async () => {
  //   const msg = Reflect.construct(Discord.Message, [
  //     mockClient,
  //     {
  //       content: "$airdrop 1 cake for 5",
  //       author: {
  //         id: userId,
  //         username: "tester",
  //         discriminator: 1234,
  //       },
  //       id: Discord.SnowflakeUtil.generate(),
  //       guild_id: Discord.SnowflakeUtil.generate(),
  //       channel_id: Discord.SnowflakeUtil.generate(),
  //     },
  //     Reflect.construct(Discord.TextChannel, [
  //       guild,
  //       {
  //         client: mockClient,
  //         guild: guild,
  //         id: Discord.SnowflakeUtil.generate(),
  //       },
  //     ]),
  //   ])
  //   const balResp = {
  //     ok: true,
  //     data: [
  //       {
  //         balances: 10,
  //         balances_in_usd: 20.5,
  //         id: "pancake-swap",
  //         name: "Panswap Cake",
  //         rate_in_usd: 2.05,
  //         symbol: "CAKE",
  //       },
  //       {
  //         balances: 5,
  //         balances_in_usd: 10,
  //         id: "fantom",
  //         name: "Fantom",
  //         rate_in_usd: 2,
  //         symbol: "FTM",
  //       },
  //     ],
  //   }
  //   const payload = {
  //     sender: userId,
  //     recipients: [],
  //     guildId: msg.guild_id,
  //     channelId: msg.channel_id,
  //     amount: 1,
  //     token: "CAKE",
  //     each: false,
  //     all: false,
  //     transferType: "airdrop",
  //     duration: 180,
  //     fullCommand: "",
  //     opts: { duration: 180, maxEntries: 5 },
  //   }
  //   defi.getAirdropPayload = jest.fn().mockResolvedValueOnce(payload)
  //   defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(balResp)
  //   const expected = composeEmbedMessage(null, {
  //     title: ":airplane: Confirm airdrop",
  //     description:
  //       "Are you sure you want to spend <:cake:972205674371117126> **1 CAKE** (\u2248 $2.05) on this airdrop?",
  //   }).addFields([
  //     {
  //       name: "Total reward",
  //       value: "<:cake:972205674371117126> **1 CAKE** (\u2248 $2.05)",
  //       inline: true,
  //     },
  //     {
  //       name: "Run time",
  //       value: "3m",
  //       inline: true,
  //     },
  //     {
  //       name: "Max entries",
  //       value: "5",
  //       inline: true,
  //     },
  //   ])
  //   const output = await command.run(msg)
  //   expect(defi.getAirdropPayload).toHaveBeenCalledTimes(1)
  //   expect(defi.offchainGetUserBalances).toHaveBeenCalledTimes(1)
  //   expect(expected.title).toStrictEqual(
  //     (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
  //   )
  //   expect(expected.description).toStrictEqual(
  //     (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
  //       .description
  //   )
  //   expect(expected.fields).toStrictEqual(
  //     (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].fields
  //   )
  // })

  // test("airdrop full command", async () => {
  //   const msg = Reflect.construct(Discord.Message, [
  //     mockClient,
  //     {
  //       content: "$airdrop 1 cake in 100sec for 3",
  //       author: {
  //         id: userId,
  //         username: "tester",
  //         discriminator: 1234,
  //       },
  //       id: Discord.SnowflakeUtil.generate(),
  //       guild_id: Discord.SnowflakeUtil.generate(),
  //       channel_id: Discord.SnowflakeUtil.generate(),
  //     },
  //     Reflect.construct(Discord.TextChannel, [
  //       guild,
  //       {
  //         client: mockClient,
  //         guild: guild,
  //         id: Discord.SnowflakeUtil.generate(),
  //       },
  //     ]),
  //   ])
  //   const balResp = {
  //     ok: true,
  //     data: [
  //       {
  //         balances: 10,
  //         balances_in_usd: 20.5,
  //         id: "pancake-swap",
  //         name: "Panswap Cake",
  //         rate_in_usd: 2.05,
  //         symbol: "CAKE",
  //       },
  //       {
  //         balances: 5,
  //         balances_in_usd: 10,
  //         id: "fantom",
  //         name: "Fantom",
  //         rate_in_usd: 2,
  //         symbol: "FTM",
  //       },
  //     ],
  //   }
  //   const payload = {
  //     sender: userId,
  //     recipients: [],
  //     guildId: msg.guild_id,
  //     channelId: msg.channel_id,
  //     amount: 1,
  //     token: "CAKE",
  //     each: false,
  //     all: false,
  //     transferType: "airdrop",
  //     duration: 100,
  //     fullCommand: "",
  //     opts: { duration: 100, maxEntries: 3 },
  //   }
  //   defi.getAirdropPayload = jest.fn().mockResolvedValueOnce(payload)
  //   defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(balResp)
  //   const expected = composeEmbedMessage(null, {
  //     title: ":airplane: Confirm airdrop",
  //     description:
  //       "Are you sure you want to spend <:cake:972205674371117126> **1 CAKE** (\u2248 $2.05) on this airdrop?",
  //   }).addFields([
  //     {
  //       name: "Total reward",
  //       value: "<:cake:972205674371117126> **1 CAKE** (\u2248 $2.05)",
  //       inline: true,
  //     },
  //     {
  //       name: "Run time",
  //       value: "1m40s",
  //       inline: true,
  //     },
  //     {
  //       name: "Max entries",
  //       value: "3",
  //       inline: true,
  //     },
  //   ])
  //   const output = await command.run(msg)
  //   expect(defi.getAirdropPayload).toHaveBeenCalledTimes(1)
  //   expect(defi.offchainGetUserBalances).toHaveBeenCalledTimes(1)
  //   expect(expected.title).toStrictEqual(
  //     (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
  //   )
  //   expect(expected.description).toStrictEqual(
  //     (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
  //       .description
  //   )
  //   expect(expected.fields).toStrictEqual(
  //     (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].fields
  //   )
  // })

  // test("airdrop api balance failed", async () => {
  //   const msg = Reflect.construct(Discord.Message, [
  //     mockClient,
  //     {
  //       content: "$airdrop 1 cake",
  //       author: {
  //         id: userId,
  //         username: "tester",
  //         discriminator: 1234,
  //       },
  //       id: Discord.SnowflakeUtil.generate(),
  //       guild_id: Discord.SnowflakeUtil.generate(),
  //       channel_id: Discord.SnowflakeUtil.generate(),
  //     },
  //     Reflect.construct(Discord.TextChannel, [
  //       guild,
  //       {
  //         client: mockClient,
  //         guild: guild,
  //         id: Discord.SnowflakeUtil.generate(),
  //       },
  //     ]),
  //   ])
  //   const balResp = {
  //     error: "error",
  //   }
  //   const payload = {
  //     sender: userId,
  //     recipients: [],
  //     guildId: msg.guild_id,
  //     channelId: msg.channel_id,
  //     amount: 1,
  //     token: "CAKE",
  //     each: false,
  //     all: false,
  //     transferType: "airdrop",
  //     duration: 180,
  //     fullCommand: "",
  //     opts: { duration: 180, maxEntries: 0 },
  //   }
  //   defi.getAirdropPayload = jest.fn().mockResolvedValueOnce(payload)
  //   defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(balResp)
  //   try {
  //     await command.run(msg)
  //   } catch (e) {
  //     expect(defi.getAirdropPayload).toHaveBeenCalledTimes(1)
  //     expect(defi.offchainGetUserBalances).toHaveBeenCalledTimes(1)
  //     expect(e).toBeInstanceOf(APIError)
  //   }
  // })

  // test("airdrop not enough bal", async () => {
  //   const msg = Reflect.construct(Discord.Message, [
  //     mockClient,
  //     {
  //       content: "$airdrop 10 cake in 110sec for 5",
  //       author: {
  //         id: userId,
  //         username: "tester",
  //         discriminator: 1234,
  //       },
  //       id: Discord.SnowflakeUtil.generate(),
  //       guild_id: Discord.SnowflakeUtil.generate(),
  //       channel_id: Discord.SnowflakeUtil.generate(),
  //     },
  //     Reflect.construct(Discord.TextChannel, [
  //       guild,
  //       {
  //         client: mockClient,
  //         guild: guild,
  //         id: Discord.SnowflakeUtil.generate(),
  //       },
  //     ]),
  //   ])
  //   const balResp = {
  //     ok: true,
  //     data: [
  //       {
  //         balances: 1,
  //         balances_in_usd: 2.05,
  //         id: "pancake-swap",
  //         name: "Panswap Cake",
  //         rate_in_usd: 2.05,
  //         symbol: "CAKE",
  //       },
  //       {
  //         balances: 5,
  //         balances_in_usd: 10,
  //         id: "fantom",
  //         name: "Fantom",
  //         rate_in_usd: 2,
  //         symbol: "FTM",
  //       },
  //     ],
  //   }
  //   const payload = {
  //     sender: userId,
  //     recipients: [],
  //     guildId: msg.guild_id,
  //     channelId: msg.channel_id,
  //     amount: 10,
  //     token: "CAKE",
  //     each: false,
  //     all: false,
  //     transferType: "airdrop",
  //     duration: 110,
  //     fullCommand: "",
  //     opts: { duration: 110, maxEntries: 5 },
  //   }
  //   const mockMsg = composeEmbedMessage(msg, {
  //     title: ":no_entry_sign: Insufficient balance",
  //     description: `<@${userId}>, you cannot afford this.`,
  //   }).addFields([
  //     {
  //       name: "Required amount",
  //       value: "<:cake:972205674371117126> 5 CAKE",
  //       inline: true,
  //     },
  //     {
  //       name: "Your balance",
  //       value: "<:cake:972205674371117126> 1 CAKE",
  //       inline: true,
  //     },
  //   ])
  //   defi.getAirdropPayload = jest.fn().mockResolvedValueOnce(payload)
  //   defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(balResp)
  //   defi.composeInsufficientBalanceEmbed = jest
  //     .fn()
  //     .mockReturnValueOnce(mockMsg)
  //   const expected = composeEmbedMessage(null, {
  //     title: ":no_entry_sign: Insufficient balance",
  //     description: `<@${userId}>, you cannot afford this.`,
  //   }).addFields([
  //     {
  //       name: "Required amount",
  //       value: "<:cake:972205674371117126> 5 CAKE",
  //       inline: true,
  //     },
  //     {
  //       name: "Your balance",
  //       value: "<:cake:972205674371117126> 1 CAKE",
  //       inline: true,
  //     },
  //   ])
  //   const output = await command.run(msg)
  //   expect(defi.getAirdropPayload).toHaveBeenCalledTimes(1)
  //   expect(defi.offchainGetUserBalances).toHaveBeenCalledTimes(1)
  //   expect(defi.composeInsufficientBalanceEmbed).toHaveBeenCalledTimes(1)
  //   expect(expected.title).toStrictEqual(
  //     (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
  //   )
  //   expect(expected.description).toStrictEqual(
  //     (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
  //       .description
  //   )
  //   expect(expected.fields).toStrictEqual(
  //     (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].fields
  //   )
  // })
})
