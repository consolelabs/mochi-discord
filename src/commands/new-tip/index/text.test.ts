import { userMention } from "@discordjs/builders"
import { commands } from "commands"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
jest.mock("adapters/defi")

describe("run", () => {
  const msg = mockdc.cloneMessage()
  const tipCmd = commands["tip"]

  test("tip user successfully", async () => {
    const recipient = userMention("521591222826041344")
    msg.content = `$tip ${recipient} 1.5 cake`
    jest.spyOn(processor, "tip").mockResolvedValueOnce(undefined)
    await tipCmd.run(msg)
    expect(processor.tip).toHaveBeenCalledWith(msg, [
      "tip",
      recipient,
      "1.5",
      "cake",
    ])
  })
})
