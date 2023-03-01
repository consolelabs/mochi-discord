import defi from "adapters/defi"
import { slashCommands } from "commands"
import { CommandInteraction, MessageOptions } from "discord.js"
import { APIError } from "errors"
import { RunResult } from "types/common"
import { composeEmbedMessage, justifyEmbedFields } from "ui/discord/embed"
import { emojis, getEmojiURL } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"

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
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(balResp)
    const expected = composeEmbedMessage(null, {
      author: ["Offchain balance", getEmojiURL(emojis.WALLET)],
    })
      .addFields({
        name: "Panswap Cake",
        value:
          "<:cake:972205674371117126> 10 CAKE `$20.5` <:blank:967287119448014868>",
        inline: true,
      })
      .addFields({
        name: "Fantom",
        value:
          "<:ftm:967285237686108212> 5 FTM `$10` <:blank:967287119448014868>",
        inline: true,
      })
    justifyEmbedFields(expected, 3)
    expected.addFields({
      name: `Estimated total (U.S dollar)`,
      value: "<:cash:933341119998210058> `$30.5`",
    })
    const output = await balCmd.run(i)
    expect(defi.offchainGetUserBalances).toHaveBeenCalledTimes(1)
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.fields).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].fields
    )
  })

  test("dont have balances", async () => {
    const balResp = {
      ok: true,
      data: [],
    }
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(balResp)
    const expected = composeEmbedMessage(null, {
      author: ["Offchain balance", getEmojiURL(emojis.WALLET)],
      description: "No balance. Try `$deposit` more into your wallet.",
    })
    const output = await balCmd.run(i)
    expect(defi.offchainGetUserBalances).toHaveBeenCalledTimes(1)
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
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(balResp)
    try {
      await balCmd.run(i)
    } catch (e) {
      expect(defi.offchainGetUserBalances).toHaveBeenCalledTimes(1)
      expect(e).toBeInstanceOf(APIError)
    }
  })
})
