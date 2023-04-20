import { slashCommands } from "commands"
import { CommandInteraction, MessageOptions } from "discord.js"
import { APIError } from "errors"
import { RunResult } from "types/common"
import { composeEmbedMessage, justifyEmbedFields } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { APPROX } from "utils/constants"
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
      author: ["Mochi balance", getEmojiURL(emojis.WALLET)],
      description: `<a:animated_pointing_right:1093923073557807175> You can withdraw the coin to you crypto wallet by \`$withdraw\`.\n<a:animated_pointing_right:1093923073557807175> All the tip transaction will take from this balance. You can try \`$tip <recipient> <amount> <token>\` to transfer coin.\n\n<:cake:972205674371117126> \`10 CAKE ${APPROX} $30\`\n<:ftm:967285237686108212> \`5 FTM   ${APPROX} $2.5\``,
    })
    justifyEmbedFields(expected, 3)
    expected.addFields({
      name: `Total (U.S dollar)`,
      value: `${getEmoji("CASH")} \`$32.5\``,
    })
    const output = await balCmd.run(i)
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("dont have balances", async () => {
    const balResp = {
      ok: true,
      data: [],
    }
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce(balResp)
    const expected = composeEmbedMessage(null, {
      author: ["Mochi balance", getEmojiURL(emojis.WALLET)],
      description: "No balance. Try `$deposit` more into your wallet.",
    })
    const output = await balCmd.run(i)
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
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
