import { BotBaseError } from "errors"
import { mockInteraction, mockMessage } from "../../tests/mocks"
import ChannelLogger from "../logger/channel"
import { wrapError } from "./wrap-error"

describe("wrapError", () => {
  it("uses the alert method of channel logger", async () => {
    jest.spyOn(ChannelLogger, "alert")

    const error = new Error("boom")
    const expectedError = new BotBaseError(mockInteraction, error.message)

    await wrapError(mockInteraction, async () => {
      throw error
    })

    expectedError.handle()

    expect(ChannelLogger.alert).toBeCalledWith(mockMessage, expectedError)
  })
})
