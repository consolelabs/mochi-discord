import * as commands from "commands"
import { CommandNotAllowedToRunError } from "errors/command-not-allowed"
import * as embed_ui from "ui/discord/embed"
import * as commands_utils from "utils/commands"
import mockdc from "../../tests/mocks/discord"
jest.mock("adapters/config")

const mockMessage = mockdc.getMessage()

describe("handlePrefixedCommand", () => {
  afterEach(() => jest.clearAllMocks())

  it("empty message => nothings invoked", async () => {
    mockMessage.content = ""
    jest.spyOn(commands, "preauthorizeCommand")
    jest.spyOn(embed_ui, "getCommandSuggestion")
    await commands.handlePrefixedCommand(mockMessage)
    expect(commands.preauthorizeCommand).not.toHaveBeenCalled()
    expect(embed_ui.getCommandSuggestion).not.toHaveBeenCalled()
  })

  it("command not found => suggest commands", async () => {
    // input must fuzzy-match (>=0.5) a surviving text command that has actions,
    // or getCommandSuggestion correctly returns null and nothing is replied
    mockMessage.content = "$watchlis 123"
    jest.spyOn(commands, "preauthorizeCommand")
    jest.spyOn(embed_ui, "getCommandSuggestion")
    await commands.handlePrefixedCommand(mockMessage)
    expect(commands.preauthorizeCommand).not.toHaveBeenCalled()
    // suggest commands to users
    expect(embed_ui.getCommandSuggestion).toHaveBeenCalledTimes(1)
    expect(mockMessage.reply).toHaveBeenCalledTimes(1)
  })

  it("help msg for nonexistent command => suggest commands", async () => {
    mockMessage.content = "$help watchlis"
    jest.spyOn(commands, "preauthorizeCommand")
    jest.spyOn(embed_ui, "getCommandSuggestion")
    jest.spyOn(commands_utils, "getCommandMetadata")
    await commands.handlePrefixedCommand(mockMessage)
    expect(commands.preauthorizeCommand).not.toHaveBeenCalled()
    // suggest commands to users
    expect(embed_ui.getCommandSuggestion).toHaveBeenCalledTimes(1)
    expect(mockMessage.reply).toHaveBeenCalledTimes(1)
    expect(commands_utils.getCommandMetadata).toHaveBeenCalledWith(
      commands.commands,
      mockMessage,
    )
    expect(commands_utils.getCommandMetadata).toHaveReturnedWith({
      commandKey: "watchlis",
      action: undefined,
      isSpecificHelpCommand: true,
    })
  })

  it("$tick ftm (DM) => throw CommandNotAllowedToRunError", async () => {
    try {
      mockMessage.content = "$tick ftm"
      mockMessage.channel.type = "DM"
      await commands.handlePrefixedCommand(mockMessage)
    } catch (e) {
      expect(e).toBeInstanceOf(CommandNotAllowedToRunError)
    }
  })
})
