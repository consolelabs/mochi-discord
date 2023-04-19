import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { SPACE } from "utils/constants"
import * as tiputils from "utils/tip-bot"
import * as defiutils from "utils/defi"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { MessageActionRow, MessageButton, MessageOptions } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { RunResult } from "types/common"

jest.mock("adapters/defi")

describe("getAirdropPayload", () => {
  const msg = mockdc.cloneMessage()

  test("invalid number of args", async () => {
    await expect(
      processor.getAirdropPayload(msg, ["airdrop", "1", "ftm", "in"])
    ).rejects.toThrow(
      new DiscordWalletTransferError({
        discordId: msg.author.id,
        message: msg,
        error: "Invalid number of airdrop arguments",
      })
    )
  })

  test("unsupported token", async () => {
    const args = ["airdrop", "1", "ftm"]
    jest
      .spyOn(tiputils, "parseMonikerinCmd")
      .mockResolvedValueOnce({ moniker: undefined, newArgs: args })
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(false)
    const replyFn = jest.fn()
    msg.reply = replyFn
    await processor.getAirdropPayload(msg, args)

    expect(replyFn).toBeCalledWith({
      embeds: [
        composeEmbedMessage(null, {
          author: ["Unsupported token", getEmojiURL(emojis.REVOKE)],
          color: msgColors.GRAY,
        }),
      ],
    })
  })

  test("invalid amount", async () => {
    const monikerRes = {
      newArgs: ["airdrop", "abc", "FTM"],
      moniker: {
        moniker: { moniker: "asd", plural: "", amount: NaN },
        value: 0.446973,
      },
    }
    const args = ["airdrop", "a", "asd"]
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(monikerRes)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    const replyFn = jest.fn()
    msg.reply = replyFn
    await processor.getAirdropPayload(msg, args)

    expect(replyFn).toBeCalledWith({
      embeds: [
        composeEmbedMessage(null, {
          author: ["Invalid amount", getEmojiURL(emojis.REVOKE)],
          color: msgColors.GRAY,
        }),
      ],
    })
  })

  test("successfully (1 ftm)", async () => {
    const monikerRes = {
      newArgs: ["airdrop", "a", "FTM"],
      moniker: undefined,
    }
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(monikerRes)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    const output = await processor.getAirdropPayload(msg, monikerRes.newArgs)
    const expected = {
      sender: msg.author.id,
      recipients: [],
      guildId: msg.guildId,
      channelId: msg.channelId,
      amount: 1,
      all: false,
      each: false,
      fullCommand: monikerRes.newArgs.join(" ").trim(),
      duration: 180,
      token: "FTM",
      transferType: "airdrop",
      opts: { duration: 180, maxEntries: 0 },
    }
    expect(output).toStrictEqual(expected)
  })

  test("successfully (1 ftm)", async () => {
    const monikerRes = {
      newArgs: ["airdrop", "a", "FTM"],
      moniker: undefined,
    }
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(monikerRes)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    const output = await processor.getAirdropPayload(msg, monikerRes.newArgs)
    const expected = {
      sender: msg.author.id,
      recipients: [],
      guildId: msg.guildId,
      channelId: msg.channelId,
      amount: 1,
      all: false,
      each: false,
      fullCommand: monikerRes.newArgs.join(" ").trim(),
      duration: 180,
      token: "FTM",
      transferType: "airdrop",
      opts: { duration: 180, maxEntries: 0 },
    }
    expect(output).toStrictEqual(expected)
  })

  test("successfully with moniker & full opts (1 apple)", async () => {
    const args = ["airdrop", "an", "apple", "in", " 30s", "for", "3"]
    const monikerRes = {
      newArgs: ["airdrop", "1", "ETH", "in", " 30s", "for", "3"],
      moniker: undefined,
    }
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(monikerRes)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    const output = await processor.getAirdropPayload(msg, args)
    const expected = {
      sender: msg.author.id,
      recipients: [],
      guildId: msg.guildId,
      channelId: msg.channelId,
      amount: 1,
      all: false,
      each: false,
      fullCommand: args.join(SPACE),
      duration: 30,
      token: "ETH",
      transferType: "airdrop",
      opts: { duration: 30, maxEntries: 3 },
    }
    expect(output).toStrictEqual(expected)
  })
})

describe("handleAirdrop", () => {
  test("successfully (all)", async () => {
    const msg = mockdc.cloneMessage()
    const args = ["airdrop", "all", "ftm", "in", " 30s", "for", "3"]
    jest
      .spyOn(tiputils, "parseMonikerinCmd")
      .mockResolvedValueOnce({ newArgs: args, moniker: undefined })
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    jest
      .spyOn(defiutils, "validateBalance")
      .mockResolvedValueOnce({ balance: 5.5, usdBalance: 2.75 })
    const output = (await processor.handleAirdrop(
      msg,
      args
    )) as RunResult<MessageOptions>
    const amountInfo = `${getEmoji("FTM")} **5.5 FTM** (\u2248 $15.125)`
    const embed = composeEmbedMessage(null, {
      title: `${getEmoji("AIRDROP")} Confirm airdrop`,
      description: `Are you sure you want to spend ${amountInfo} on this airdrop?`,
      color: msgColors.BLUE,
    }).addFields([
      { name: "Total reward", value: amountInfo, inline: true },
      { name: "Run time", value: `30s`, inline: true },
      { name: "Max entries", value: "3", inline: true },
    ])
    const expected = {
      messageOptions: {
        embeds: [embed],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton({
              customId: `confirm_airdrop-${msg.author.id}-5.5-15.125-FTM-30-3`,
              emoji: getEmoji("CHECK"),
              style: "SUCCESS",
              label: "Confirm",
            }),
            new MessageButton({
              customId: `cancel_airdrop-${msg.author.id}`,
              emoji: getEmoji("REVOKE"),
              style: "DANGER",
              label: "Cancel",
            })
          ),
        ],
      },
    }
    assertRunResult(output, expected)
  })

  test("successfully (all)", async () => {
    const msg = mockdc.cloneMessage()
    const args = ["airdrop", "all", "ftm", "in", " 30s", "for", "3"]
    jest
      .spyOn(tiputils, "parseMonikerinCmd")
      .mockResolvedValueOnce({ newArgs: args, moniker: undefined })
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    jest
      .spyOn(defiutils, "validateBalance")
      .mockResolvedValueOnce({ balance: 5.5, usdBalance: 2.75 })
    const output = (await processor.handleAirdrop(
      msg,
      args
    )) as RunResult<MessageOptions>
    const amountInfo = `${getEmoji("FTM")} **5.5 FTM** (\u2248 $15.125)`
    const embed = composeEmbedMessage(null, {
      title: `${getEmoji("AIRDROP")} Confirm airdrop`,
      description: `Are you sure you want to spend ${amountInfo} on this airdrop?`,
      color: msgColors.BLUE,
    }).addFields([
      { name: "Total reward", value: amountInfo, inline: true },
      { name: "Run time", value: `30s`, inline: true },
      { name: "Max entries", value: "3", inline: true },
    ])
    const expected = {
      messageOptions: {
        embeds: [embed],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton({
              customId: `confirm_airdrop-${msg.author.id}-5.5-15.125-FTM-30-3`,
              emoji: getEmoji("CHECK"),
              style: "SUCCESS",
              label: "Confirm",
            }),
            new MessageButton({
              customId: `cancel_airdrop-${msg.author.id}`,
              emoji: getEmoji("REVOKE"),
              style: "DANGER",
              label: "Cancel",
            })
          ),
        ],
      },
    }
    assertRunResult(output, expected)
  })
})
