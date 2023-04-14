import { slashCommands } from "commands"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"

describe("run", () => {
  const i = mockdc.cloneCommandInteraction()
  const cmd = slashCommands["airdrop"]

  const airdropOutputMock = {
    messageOptions: { embeds: [composeEmbedMessage(null, {})], components: [] },
  }

  test("successfully without opts", async () => {
    i.options.getNumber = jest.fn().mockReturnValueOnce("1")
    i.options.getString = jest.fn().mockReturnValueOnce("ftm")
    jest
      .spyOn(processor, "handleAirdrop")
      .mockResolvedValueOnce(airdropOutputMock)
    await cmd.run(i)
    expect(processor.handleAirdrop).toBeCalledWith(i, ["airdrop", "1", "ftm"])
  })

  test("successfully with duration", async () => {
    i.options.getNumber = jest.fn().mockReturnValueOnce("1")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("ftm")
      .mockReturnValueOnce("30")
    jest
      .spyOn(processor, "handleAirdrop")
      .mockResolvedValueOnce(airdropOutputMock)
    await cmd.run(i)
    expect(processor.handleAirdrop).toBeCalledWith(i, [
      "airdrop",
      "1",
      "ftm",
      "in",
      "30",
    ])
  })

  test("successfully with max entries = 1", async () => {
    i.options.getNumber = jest
      .fn()
      .mockReturnValueOnce("1")
      .mockReturnValueOnce("1")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("ftm")
      .mockReturnValueOnce(null)

    jest
      .spyOn(processor, "handleAirdrop")
      .mockResolvedValueOnce(airdropOutputMock)
    await cmd.run(i)
    expect(processor.handleAirdrop).toBeCalledWith(i, [
      "airdrop",
      "1",
      "ftm",
      "for",
      "1",
    ])
  })

  test("successfully with full opts (in 20s for 1)", async () => {
    i.options.getNumber = jest
      .fn()
      .mockReturnValueOnce("1")
      .mockReturnValueOnce("1")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("ftm")
      .mockReturnValueOnce("20")
    jest
      .spyOn(processor, "handleAirdrop")
      .mockResolvedValueOnce(airdropOutputMock)
    await cmd.run(i)
    expect(processor.handleAirdrop).toBeCalledWith(i, [
      "airdrop",
      "1",
      "ftm",
      "in",
      "20",
      "for",
      "1",
    ])
  })
})

// the development team has released many features, which helps to improve working experience to end users - technicians.
