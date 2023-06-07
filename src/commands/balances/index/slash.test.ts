import { slashCommands } from "commands"
import { CommandInteraction, MessageOptions } from "discord.js"
import { APIError } from "errors"
import { RunResult } from "types/common"
import { composeEmbedMessage, justifyEmbedFields } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"
import mochiPay from "../../../adapters/mochi-pay"

jest.mock("adapters/defi")
const balCmd = slashCommands["balances"]

describe("balances", () => {
  let i: CommandInteraction

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))
  test("balances", async () => {
    const balResp = {
      ok: true,
      data: [
        {
          amount: 10000000000000000000,
          token: {
            name: "Panswap Cake",
            symbol: "CAKE",
            decimal: 18,
            price: 3,
          },
        },
        {
          amount: 5000000000000000000,
          token: {
            name: "Fantom",
            symbol: "FTM",
            decimal: 18,
            price: 0.5,
          },
        },
      ],
    }
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce(balResp)
    const expected = composeEmbedMessage(null, {
      author: ["Mochi wallet", getEmojiURL(emojis.NFT2)],
      description: `<:cake:1113114867361120287> \`10 CAKE ≈  $30\`\n<:ftm:967285237686108212> \`5 FTM   ≈ $2.5\``,
    })
    justifyEmbedFields(expected, 3)
    expected.addFields({
      name: `Total (U.S dollar)`,
      value: `${getEmoji("CASH")} \`$32.5\``,
    })
    const output = await balCmd.run(i)
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    ).toStrictEqual(expected.author)
    expect(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    ).toStrictEqual(expected.description)
  })

  test("dont have balances", async () => {
    const balResp = {
      ok: true,
      data: [],
    }
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce(balResp)
    const expected = composeEmbedMessage(null, {
      author: ["Mochi wallet", getEmojiURL(emojis.NFT2)],
      description: `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} You have nothing yet, use ${await getSlashCommand(
        "earn"
      )} or ${await getSlashCommand("deposit")}`,
    })
    const output = await balCmd.run(i)
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    ).toStrictEqual(expected.author)
    expect(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    ).toStrictEqual(expected.description)
  })

  test("balances api error", async () => {
    const balResp = {
      error: "error",
    }
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce(balResp)
    try {
      await balCmd.run(i)
    } catch (e) {
      expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
      expect(e).toBeInstanceOf(APIError)
    }
  })
})
