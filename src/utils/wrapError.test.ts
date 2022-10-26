import { BotBaseError } from "errors"
import { mockMessage } from "../../tests/mocks"
import ChannelLogger from "./ChannelLogger"
import { wrapError } from "./wrapError"

describe("wrapError", () => {
  it("uses the alert method of channel logger", async () => {
    jest.spyOn(ChannelLogger, "alert")
    const error = new Error("boom")
    const expectedError = new BotBaseError(mockMessage, error.message)

    await wrapError(mockMessage, async () => {
      throw error
    })

    expect(ChannelLogger.alert).toBeCalledWith(mockMessage, expectedError)
  })
})
