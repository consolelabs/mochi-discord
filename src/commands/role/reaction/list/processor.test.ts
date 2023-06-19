import { truncate } from "lodash"
import {
  ReactionRoleListConfigGroup,
  ReactionRoleListPaginated,
} from "types/config"
import * as processor from "./processor"
import mockdc from "../../../../../tests/mocks/discord"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import {
  composeEmbedMessage,
  composeEmbedMessage2,
  getErrorEmbed,
} from "ui/discord/embed"
import {
  assertAuthor,
  assertDescription,
} from "../../../../../tests/assertions/discord"
import * as button from "handlers/discord/button"
import { ResponseRoleReactionByMessage } from "types/api"
import { Message, SnowflakeUtil } from "discord.js"
import config from "adapters/config"
import { SLASH_PREFIX } from "utils/constants"
jest.mock("handlers/discord/button")
jest.mock("adapters/config")

describe("getDisplayColumnText", () => {
  const data: ReactionRoleListConfigGroup[] = [
    {
      url: "test",
      title: "test",
      values: [
        {
          role: "test",
          emoji: "test",
        },
      ],
    },
  ]

  test("should return proper two columns", async () => {
    const [infoColumn, jumpBtnColumn] = processor.getDisplayInfoColumns(data)
    const expectedInfoColumn =
      `\n**${truncate(data[0].title, { length: 20 })}**\n` +
      `${getEmoji("BLANK")}${getEmoji("REPLY")} ${data[0].values[0].emoji} ${
        data[0].values[0].role
      }\n`
    const expectedJumpBtnColumn =
      `**[Jump](${data[0].url})**\n\n` + "\n".repeat(1)
    expect(infoColumn).toEqual(expectedInfoColumn)
    expect(jumpBtnColumn).toEqual(expectedJumpBtnColumn)
  })
})

describe("getEmbedPagination", () => {
  const mockedConfigMap = new Map<number, ReactionRoleListConfigGroup[]>()
  mockedConfigMap.set(0, [
    {
      url: "test",
      title: "test",
      values: [
        {
          role: "test",
          emoji: "test",
        },
      ],
    },
  ])
  const pages: ReactionRoleListPaginated = {
    totalPage: 1,
    items: mockedConfigMap,
  }
  const mockedInfoColumn =
    `\n**${truncate("test", { length: 20 })}**\n` +
    `${getEmoji("BLANK")}${getEmoji("REPLY")} test test\n`
  const mockedJumpColumn = "**[Jump](test)**\n\n" + "\n".repeat(1)

  test("with type Message", async () => {
    const msg = mockdc.cloneMessage()
    const output = await processor.getEmbedPagination(pages, msg)
    const expected = composeEmbedMessage(msg, {
      author: ["Reaction role list", getEmojiURL(emojis.NEKOLOVE)],
      description: `Run \`$rr set <message_id> <emoji> <role>\` to add a reaction role.`,
      footer: ["Page 1 / 1"],
    }).addFields(
      { name: "\u200B", value: mockedInfoColumn, inline: true },
      { name: "\u200B", value: mockedJumpColumn, inline: true }
    )
    assertAuthor({ messageOptions: output }, expected)
    assertDescription({ messageOptions: output }, expected)
  })

  test("with type CommandInteraction", async () => {
    const msg = mockdc.cloneCommandInteraction()
    jest
      .spyOn(button, "listenForPaginateInteraction")
      .mockImplementationOnce(() => null)
    const output = await processor.getEmbedPagination(pages, msg)
    const expected = composeEmbedMessage2(msg, {
      author: ["Reaction role list", getEmojiURL(emojis.NEKOLOVE)],
      description: `Run \`$rr set <message_id> <emoji> <role>\` to add a reaction role.`,
      footer: ["Page 1 / 1"],
    }).addFields(
      { name: "\u200B", value: mockedInfoColumn, inline: true },
      { name: "\u200B", value: mockedJumpColumn, inline: true }
    )
    assertAuthor({ messageOptions: output }, expected)
    assertDescription({ messageOptions: output }, expected)
  })
})

describe("handleRoleList", () => {
  const msg = {
    guildId: SnowflakeUtil.generate(),
    guild: {
      id: SnowflakeUtil.generate(),
    },
    user: {
      tag: "#1234",
      avatarURL: jest.fn().mockReturnValueOnce("test"),
    },
  } as unknown as Message

  test("should throw error when guild not found", async () => {
    const msg = {} as unknown as Message
    const expected = getErrorEmbed({
      title: "This command must be run in a guild",
      description:
        "User invoked a command that was likely in a DM because guild id can not be found",
    })
    const output = await processor.handleRoleList(msg)
    assertAuthor({ messageOptions: output }, expected)
    assertDescription({ messageOptions: output }, expected)
  })

  test("should response with no role config msg", async () => {
    jest.spyOn(config, "listAllReactionRoles").mockResolvedValueOnce({
      data: {
        configs: [],
      },
      ok: true,
      status: 200,
      error: null,
      log: "",
      curl: "",
    })
    const output = await processor.handleRoleList(msg)
    const expected = composeEmbedMessage(null, {
      author: ["No reaction roles found", getEmojiURL(emojis.NEKOLOVE)],
      description: `You haven't set any reaction roles yet. To set a new one, run \`\`\`${SLASH_PREFIX}role reaction set <message_link> <emoji> <role>\`\`\``,
    })
    assertAuthor({ messageOptions: output }, expected)
    assertDescription({ messageOptions: output }, expected)
  })

  test("successfully list role", async () => {
    const mockConfig: ResponseRoleReactionByMessage = {
      roles: [
        {
          id: SnowflakeUtil.generate(),
          reaction: `<:test:${SnowflakeUtil.generate()}`,
        },
      ],
      message_id: "test",
      channel_id: "test",
    }
    const mockedConfigMap = new Map<number, ReactionRoleListConfigGroup[]>()
    mockedConfigMap.set(0, [
      {
        url: "https://discord.com/channels/test/test/test",
        title: "test",
        values: [
          {
            role: "<@&test>",
            emoji: "test",
          },
        ],
      },
    ])
    jest.spyOn(config, "listAllReactionRoles").mockResolvedValueOnce({
      data: {
        configs: [mockConfig],
      },
      ok: true,
      status: 200,
      error: null,
      log: "",
      curl: "",
    })
    jest.spyOn(processor, "getPaginatedConfigs").mockResolvedValueOnce({
      totalPage: 1,
      items: mockedConfigMap,
    })
    const output = await processor.handleRoleList(msg)
    const expected = composeEmbedMessage(null, {
      author: ["Reaction role list", getEmojiURL(emojis.NEKOLOVE)],
      description:
        "Run `$rr set <message_id> <emoji> <role>` to add a reaction role.",
    })
    expect(processor.getPaginatedConfigs).toHaveBeenCalled()
    assertAuthor({ messageOptions: output }, expected)
    assertDescription({ messageOptions: output }, expected)
  })
})

describe("getPaginatedConfigs", () => {
  const reactMessage = {
    id: "test",
    channel: {
      id: "test",
    },
    guild: {
      id: "test",
    },
    content: "test",
    url: "https://discord.com/channels/test/test/test",
  } as unknown as Message

  const channel = {
    id: SnowflakeUtil.generate(),
    isText: jest.fn().mockReturnValue(true),
    messages: {
      fetch: jest.fn().mockResolvedValueOnce(reactMessage),
    },
  }

  const msg = {
    id: SnowflakeUtil.generate(),
    channel: {
      id: channel.id,
    },
    guild: {
      id: SnowflakeUtil.generate(),
      channels: {
        cache: {
          get: jest.fn().mockReturnValueOnce(channel),
        },
      },
    },
  } as unknown as Message

  test("should return proper paginated data", async () => {
    const mockData: ResponseRoleReactionByMessage[] = [
      {
        channel_id: msg.channel.id,
        message_id: msg.id,
        roles: [
          {
            id: "test",
            reaction: "test",
          },
        ],
      },
    ]
    const output = await processor.getPaginatedConfigs(mockData, msg)
    const mockedConfigMap = new Map<number, ReactionRoleListConfigGroup[]>()
    mockedConfigMap.set(0, [
      {
        url: "https://discord.com/channels/test/test/test",
        title: "test",
        values: [
          {
            role: "<@&test>",
            emoji: "test",
          },
        ],
      },
    ])
    const expected: ReactionRoleListPaginated = {
      totalPage: 1,
      items: mockedConfigMap,
    }
    expect(msg.guild?.channels.cache.get).toHaveBeenCalled()
    expect(msg.guild?.channels.cache.get).toHaveBeenCalledWith(
      mockData[0].channel_id
    )
    expect(channel.messages.fetch).toHaveBeenCalled()
    expect(channel.messages.fetch).toHaveBeenCalledWith(mockData[0].message_id)
    expect(output).toStrictEqual(expected)
  })
})
