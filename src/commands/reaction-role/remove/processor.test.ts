import { Guild, Message, SnowflakeUtil } from "discord.js"
import { mockClient } from "../../../../tests/mocks"
import * as processor from "./processor"
import config from "adapters/config"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  assertAuthor,
  assertDescription,
} from "../../../../tests/assertions/discord"
jest.mock("adapters/config")

describe("handleRoleRemove", () => {
  const guild = Reflect.construct(Guild, [mockClient, {}])
  const msg = {
    id: SnowflakeUtil.generate(),
    guildId: SnowflakeUtil.generate(),
    channel: {
      id: SnowflakeUtil.generate(),
    },
    guild: {
      id: SnowflakeUtil.generate(),
    },
    reactions: {
      removeAll: jest.fn().mockResolvedValueOnce(undefined),
      cache: {
        get: jest.fn().mockReturnValueOnce(null),
      },
    },
  } as unknown as Message

  afterEach(() => jest.clearAllMocks())

  test("Remove all config from a message", async () => {
    const args = [
      "rr",
      "remove",
      `https://discord.com/channels/${msg.guildId}/${msg.channel.id}/${msg.id}`,
    ]
    const requestData = {
      guild_id: "test",
      message_id: "test",
      reaction: "",
      role_id: "",
      channel_id: "",
    }
    jest.spyOn(processor, "parseRequestArguments").mockResolvedValueOnce({
      message: msg,
      guild: guild,
      requestData,
    })
    jest.spyOn(config, "removeReactionConfig").mockResolvedValueOnce({
      ok: true,
      data: [],
      error: null,
      log: "",
      curl: "",
    })
    const output = await processor.handleRoleRemove(args, msg)
    const expected = composeEmbedMessage(null, {
      author: ["Reaction roles", guild.iconURL()],
      description:
        "All reaction role configurations for this message is now clear.",
    })
    expect(msg.reactions.removeAll).toHaveBeenCalled()
    assertAuthor({ messageOptions: output }, expected)
    assertDescription({ messageOptions: output }, expected)
  })

  test("Remove a specific reaction from message", async () => {
    const args = [
      "rr",
      "remove",
      `https://discord.com/channels/${msg.guildId}/${msg.channel.id}/${msg.id}`,
      "<:pepe_raincoat:123123123>",
      "<@&123123123>",
    ]
    const requestData = {
      guild_id: "test",
      message_id: "test",
      reaction: args[3],
      role_id: "123123123",
      channel_id: "test",
    }
    jest.spyOn(processor, "parseRequestArguments").mockResolvedValueOnce({
      message: msg,
      guild: guild,
      requestData,
    })
    jest.spyOn(config, "removeReactionConfig").mockResolvedValueOnce({
      ok: true,
      data: [],
      error: null,
      log: "",
      curl: "",
    })
    const output = await processor.handleRoleRemove(args, msg)
    const expected = composeEmbedMessage(null, {
      author: ["Reaction roles", guild.iconURL()],
      description:
        "Reaction <:pepe_raincoat:123123123> is removed for <@&123123123>.",
    })
    expect(msg.reactions.cache.get).toHaveBeenCalled()
    assertAuthor({ messageOptions: output }, expected)
    assertDescription({ messageOptions: output }, expected)
  })
})

describe("parseRequestArguments", () => {
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

  test("Remove all config from a message", async () => {
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
    const args = [
      "rr",
      "remove",
      `https://discord.com/channels/${reactMessage.guild?.id}/${channel.id}/${reactMessage.id}`,
    ]
    const output = await processor.parseRequestArguments(args, msg)
    const expectedReqData = {
      guild_id: reactMessage.guild?.id,
      message_id: reactMessage.id,
      reaction: "",
      role_id: "",
      channel_id: "",
    }
    expect(msg.guild?.channels.cache.get).toHaveBeenCalled()
    expect(channel.messages.fetch).toHaveBeenCalled()
    expect(output.message.id).toEqual(reactMessage.id)
    expect(output.requestData).toStrictEqual(expectedReqData)
  })

  test("Remove a specific reaction from a message", async () => {
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
            get: jest.fn().mockReturnValueOnce(channel),
          },
        },
        roles: {
          fetch: jest.fn().mockResolvedValue(true),
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
    const output = await processor.parseRequestArguments(args, msg)
    const expectedReqData = {
      guild_id: reactMessage.guild?.id,
      message_id: reactMessage.id,
      reaction: args[3],
      role_id: "123123123",
      channel_id: reactMessage.channel.id,
    }
    expect(msg.guild?.channels.cache.get).toHaveBeenCalled()
    expect(channel.messages.fetch).toHaveBeenCalled()
    expect(output.message.id).toEqual(reactMessage.id)
    expect(output.requestData).toStrictEqual(expectedReqData)
  })
})
