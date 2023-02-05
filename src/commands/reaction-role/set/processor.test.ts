import { Message, SnowflakeUtil } from "discord.js"
import * as processor from "./processor"
import config from "adapters/config"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  assertAuthor,
  assertDescription,
} from "../../../../tests/assertions/discord"
import { getEmojiURL, emojis, msgColors } from "utils/common"
jest.mock("adapters/config")

describe("handleRoleSet", () => {
  const reactMessage = {
    id: SnowflakeUtil.generate(),
    guildId: SnowflakeUtil.generate(),
    channelId: SnowflakeUtil.generate(),
    channel: {
      id: SnowflakeUtil.generate(),
    },
    guild: {
      id: SnowflakeUtil.generate(),
    },
    content: "test",
    url: "https://discord.com/channels/test/test/test",
    react: jest.fn().mockResolvedValueOnce(undefined),
  } as unknown as Message

  const channel = {
    id: reactMessage.channel.id,
    isText: jest.fn().mockReturnValue(true),
    messages: {
      fetch: jest.fn().mockResolvedValue(reactMessage),
    },
  }

  test("Successful configured reaction role", async () => {
    const args = [
      "rr",
      "remove",
      `https://discord.com/channels/${reactMessage.guild?.id}/${channel.id}/${reactMessage.id}`,
      "<:pepe_raincoat:123123123>",
      "<@&123123123>",
    ]
    const msg = {
      id: SnowflakeUtil.generate(),
      guildId: reactMessage.guild?.id,
      channel: {
        id: channel.id,
      },
      guild: {
        id: reactMessage.guild?.id,
        channels: {
          cache: {
            get: jest.fn().mockReturnValue(channel),
          },
        },
      },
    } as unknown as Message
    jest.spyOn(processor, "validateCommandArgument").mockResolvedValueOnce({
      guildId: reactMessage.guildId ?? "test",
      channelId: reactMessage.channelId,
      roleId: "123123123",
      reactMessage,
      reaction: "<:pepe_raincoat:123123123>",
    })
    jest.spyOn(config, "updateReactionConfig").mockResolvedValueOnce({
      ok: true,
      data: [],
      error: null,
      log: "",
      curl: "",
    })
    const output = await processor.handleRoleSet(args, msg)
    const expected = composeEmbedMessage(null, {
      author: ["Reaction role set!", getEmojiURL(emojis["APPROVE"])],
      description:
        "Emoji <:pepe_raincoat:123123123> is now set to this role <@&123123123>",
      color: msgColors.SUCCESS,
    })
    expect(reactMessage.react).toHaveBeenCalled()
    assertAuthor({ messageOptions: output }, expected)
    assertDescription({ messageOptions: output }, expected)
  })
})

describe("validateCommandArgument", () => {
  const reactMessage = {
    id: SnowflakeUtil.generate(),
    channel: {
      id: SnowflakeUtil.generate(),
    },
    guild: {
      id: SnowflakeUtil.generate(),
    },
    content: "test",
    url: "https://discord.com/channels/test/test/test",
  } as unknown as Message

  const channel = {
    id: reactMessage.channel.id,
    isText: jest.fn().mockReturnValue(true),
    messages: {
      fetch: jest.fn().mockResolvedValue(reactMessage),
    },
  }

  test("Validate success with proper result", async () => {
    const msg = {
      id: SnowflakeUtil.generate(),
      guildId: reactMessage.guild?.id,
      channel: {
        id: channel.id,
      },
      guild: {
        id: reactMessage.guild?.id,
        channels: {
          cache: {
            get: jest.fn().mockReturnValue(channel),
          },
        },
        emojis: {
          cache: [{ id: "123123123" }],
        },
      },
    } as unknown as Message
    const args = [
      "rr",
      "remove",
      `https://discord.com/channels/${reactMessage.guild?.id}/${channel.id}/${reactMessage.id}`,
      "<:pepe_raincoat:123123123>",
      "<@&123123123>",
    ]
    const output = await processor.validateCommandArgument(args, msg)
    expect(msg.guild?.channels.cache.get).toHaveBeenCalled()
    expect(channel.messages.fetch).toHaveBeenCalled()
    expect(output.reaction).toEqual(args[3])
    expect(output.roleId).toStrictEqual("123123123")
  })
})
