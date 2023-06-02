import mockdc from "../../../tests/mocks/discord"
import { InternalError } from "errors"
import * as processor from "./processor"
import { getEmoji } from "utils/common"

describe("handleUpdateWlError", () => {
  const msg = mockdc.cloneMessage()

  afterEach(() => jest.clearAllMocks())

  test("No specific error found", () => {
    expect(() => processor.handleUpdateWlError(msg, "ftm", "")).toThrow(
      new InternalError({
        msgOrInteraction: msg,
        description: "",
      })
    )
  })

  test("isRemove === true && Error contains record not found", () => {
    const isRemove = true
    const symbol = "ftm"
    const description = `**${symbol.toUpperCase()}** ${
      isRemove
        ? "didn't exist in your watchlist. Add new one by `$wl add <symbol>`"
        : "hasn't been supported"
    }.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} Please choose a token supported by [Coingecko](https://www.coingecko.com/)`
    expect(
      async () =>
        await processor.handleUpdateWlError(
          msg,
          symbol,
          "record not found",
          isRemove
        )
    ).toThrow(
      new InternalError({
        msgOrInteraction: msg,
        title: "Command Error",
        description,
      })
    )
  })

  test("isRemove === false && Error contains 'record not found'", () => {
    const isRemove = false
    const symbol = "ftm"
    const description = `**${symbol.toUpperCase()}** ${
      isRemove
        ? "didn't exist in your watchlist. Add new one by `$wl add <symbol>`"
        : "hasn't been supported"
    }.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} Please choose a token supported by [Coingecko](https://www.coingecko.com/)`
    expect(
      async () =>
        await processor.handleUpdateWlError(
          msg,
          symbol,
          "record not found",
          isRemove
        )
    ).toThrow(
      new InternalError({
        msgOrInteraction: msg,
        title: "Command Error",
        description,
      })
    )
  })

  test("isRemove === false && Error message starts with 'conflict'", () => {
    const isRemove = false
    const symbol = "ftm"
    const description = `**${symbol.toUpperCase()}** has already been added to your watchlist.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} Please choose another one listed on [CoinGecko](https://www.coingecko.com).`
    expect(
      async () =>
        await processor.handleUpdateWlError(msg, symbol, "conflict", isRemove)
    ).toThrow(
      new InternalError({
        msgOrInteraction: msg,
        title: "Command Error",
        description,
      })
    )
  })
})
