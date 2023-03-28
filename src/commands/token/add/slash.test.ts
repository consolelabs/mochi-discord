import { CommandInteraction, MessageOptions } from "discord.js"
import { slashCommands } from "commands"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { getSuccessEmbed } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { RunResult } from "types/common"

describe("run", () => {
  let i: CommandInteraction
  const tokenCmd = slashCommands["token"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("command run with enough args", async () => {
    const tokenAddress = "0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272"
    const chainName = "eth"
    i.options.getSubcommand = jest.fn().mockReturnValue("add")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce(tokenAddress)
      .mockReturnValueOnce(chainName)
    const expected = {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: `Your Token submission is successful`,
            description:
              "Thank you for submitting your token request!\nWe will review and update you on the approval status as quickly as possible.",
          }),
        ],
      },
    }
    jest.spyOn(processor, "process").mockResolvedValueOnce(expected)

    const output = await tokenCmd?.run(i)

    expect(processor.process).toBeCalledWith(i, {
      user_discord_id: i.user.id,
      channel_id: i.channelId,
      message_id: i.id,
      guild_id: i.guildId,
      token_address: tokenAddress,
      token_chain: chainName,
    })
    assertRunResult(output as RunResult<MessageOptions>, expected)
  })
})
