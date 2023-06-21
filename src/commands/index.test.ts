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
    mockMessage.content = "$asd 123"
    jest.spyOn(commands, "preauthorizeCommand")
    jest.spyOn(embed_ui, "getCommandSuggestion")
    await commands.handlePrefixedCommand(mockMessage)
    expect(commands.preauthorizeCommand).not.toHaveBeenCalled()
    // suggest commands to users
    expect(embed_ui.getCommandSuggestion).toHaveBeenCalledTimes(1)
    expect(mockMessage.reply).toHaveBeenCalledTimes(1)
  })

  it("help msg for nonexistent command => suggest commands", async () => {
    mockMessage.content = "$help asd"
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
      mockMessage
    )
    expect(commands_utils.getCommandMetadata).toHaveReturnedWith({
      commandKey: "asd",
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
