import { commands } from "commands"
import { Message } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
jest.mock("adapters/defi")
jest.mock("./processor")

describe("run", () => {
  let msg: Message
  const withdrawCmd = commands["withdraw"]

  beforeEach(() => (msg = mockdc.cloneMessage()))
  afterEach(() => jest.clearAllMocks())

  test("successfully", async () => {
    const mockedDmMsg = mockdc.cloneMessage()
    const addr = "0xE409E073eE7474C381BFD9b3f88098499123123"
    msg.content = "$withdraw 1 ftm"
    msg.author.send = jest.fn().mockResolvedValueOnce(mockedDmMsg)
    msg.author.avatarURL = jest.fn().mockResolvedValueOnce(null)
    msg.reply = jest.fn().mockResolvedValueOnce(undefined)

    // Defi.getInsuffientBalanceEmbed = jest.fn().mockResolvedValueOnce(null)
    jest.spyOn(processor, "getRecipient").mockResolvedValueOnce(addr)
    const output = await withdrawCmd.run(msg)
    expect(processor.withdraw).toHaveBeenCalledWith(msg, "1", "ftm")
    expect(output).toBeFalsy()
  })
})
