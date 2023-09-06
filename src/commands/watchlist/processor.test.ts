import mockdc from "../../../tests/mocks/discord"
import { InternalError } from "errors"
import * as processor from "./processor"
import { getEmoji } from "utils/common"

describe("handleUpdateWlError", () => {
  const msg = mockdc.cloneMessage()

  afterEach(() => jest.clearAllMocks())

  test("No specific error found", async () => {
    await expect(processor.handleUpdateWlError(msg, "ftm", "")).rejects.toThrow(
      new InternalError({
        msgOrInteraction: msg,
        description: "",
      }),
    )
  })

  test("isRemove === true && Error contains record not found", async () => {
    const isRemove = true
    const symbol = "ftm"
    const description = `**${symbol.toUpperCase()}** ${
      isRemove
        ? "didn't exist in your watchlist. Add new one by `$wl add <symbol>`"
        : "hasn't been supported"
    }.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true,
    )} Please choose a token supported by [Coingecko](https://www.coingecko.com/)`
    await expect(
      processor.handleUpdateWlError(msg, symbol, "record not found", isRemove),
    ).rejects.toThrow(
      new InternalError({
        msgOrInteraction: msg,
        title: "Command Error",
        description,
      }),
    )
  })

  test("isRemove === false && Error contains 'record not found'", async () => {
    const isRemove = false
    const symbol = "ftm"
    const description = `**${symbol.toUpperCase()}** ${
      isRemove
        ? "didn't exist in your watchlist. Add new one by `$wl add <symbol>`"
        : "hasn't been supported"
    }.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true,
    )} Please choose a token supported by [Coingecko](https://www.coingecko.com/)`
    await expect(
      processor.handleUpdateWlError(msg, symbol, "record not found", isRemove),
    ).rejects.toThrow(
      new InternalError({
        msgOrInteraction: msg,
        title: "Command Error",
        description,
      }),
    )
  })

  test("isRemove === false && Error message starts with 'conflict'", async () => {
    const isRemove = false
    const symbol = "ftm"
    const description = `**${symbol.toUpperCase()}** has already been added to your watchlist.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true,
    )} Please choose another one listed on [CoinGecko](https://www.coingecko.com).`
    await expect(
      processor.handleUpdateWlError(msg, symbol, "conflict", isRemove),
    ).rejects.toThrow(
      new InternalError({
        msgOrInteraction: msg,
        title: "Command Error",
        description,
      }),
    )
  })
})
