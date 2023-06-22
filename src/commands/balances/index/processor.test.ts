import { CommandInteraction } from "discord.js"
import { APIError } from "errors"
import { composeEmbedMessage, justifyEmbedFields } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"
import mochiPay from "../../../adapters/mochi-pay"
import { BalanceType, renderBalances } from "./processor"

jest.mock("adapters/defi")

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
      description: `**Spot**\n<:cake:1113114867361120287>\`10 CAKE ≈  $30\`\n<:ftm:967285237686108212>\`5 FTM   ≈ $2.5\``,
    })
    justifyEmbedFields(expected, 3)
    expected.addFields({
      name: `Total (U.S dollar)`,
      value: `${getEmoji("CASH")} \`$32.5\``,
    })
    const { msgOpts } = await renderBalances(i.user.id, {
      showUsd: false,
      type: BalanceType.Offchain,
      interaction: i,
      address: "",
    })
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(msgOpts.embeds?.[0].author).toStrictEqual(expected.author)
    expect(msgOpts.embeds?.[0].description).toStrictEqual(expected.description)
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
    const { msgOpts } = await renderBalances(i.user.id, {
      showUsd: false,
      type: BalanceType.Offchain,
      interaction: i,
      address: "",
    })
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(msgOpts.embeds?.[0].author).toStrictEqual(expected.author)
    expect(msgOpts.embeds?.[0].description).toStrictEqual(expected.description)
  })

  test("balances api error", async () => {
    const balResp = {
      error: "error",
    }
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce(balResp)
    try {
      await renderBalances(i.user.id, {
        showUsd: false,
        type: BalanceType.Offchain,
        interaction: i,
        address: "",
      })
    } catch (e) {
      expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
      expect(e).toBeInstanceOf(APIError)
    }
  })
})
