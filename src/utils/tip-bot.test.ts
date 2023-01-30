import config from "adapters/config"
import { classifyTipSyntaxTargets, parseMonikerinCmd } from "./tip-bot"

describe("parseMonikerinCmd", () => {
  test("parse successful", async () => {
    const args = ["tip", "@user", "2", "coffee"]
    const expected = {
      newArgs: ["tip", "@user", "2", "ftm"],
      moniker: {
        value: 0.4,
        moniker: {
          amount: 1,
          moniker: "coffee",
          plural: "coffee",
          token: { token_symbol: "ftm" },
        },
      },
    }
    const monikerRes = {
      ok: true,
      error: null,
      data: [
        {
          value: 0.4,
          moniker: {
            amount: 1,
            moniker: "coffee",
            plural: "coffee",
            token: {
              token_symbol: "ftm",
            },
          },
        },
      ],
    }
    config.getMonikerConfig = jest.fn().mockResolvedValueOnce(monikerRes)
    const output = await parseMonikerinCmd(args, "guild_id")
    expect(output).toEqual(expected)
  })
  test("parse no moniker", async () => {
    const args = ["tip", "@user", "2", "ftm"]
    const expected = {
      newArgs: ["tip", "@user", "2", "ftm"],
      moniker: undefined,
    }
    const monikerRes = {
      ok: true,
      error: null,
      data: [
        {
          value: 0.4,
          moniker: {
            amount: 1,
            moniker: "coffee",
            plural: "coffee",
            token: {
              token_symbol: "ftm",
            },
          },
        },
      ],
    }
    config.getMonikerConfig = jest.fn().mockResolvedValueOnce(monikerRes)
    const output = await parseMonikerinCmd(args, "guild_id")
    expect(output).toEqual(expected)
  })
  test("parse wrong moniker", async () => {
    const args = ["tip", "@user", "2", "tea"]
    const expected = {
      newArgs: ["tip", "@user", "2", "tea"], //not moniker so keep symbol
      moniker: undefined,
    }
    const monikerRes = {
      ok: true,
      error: null,
      data: [
        {
          value: 0.4,
          moniker: {
            amount: 1,
            moniker: "coffee",
            plural: "coffee",
            token: {
              token_symbol: "ftm",
            },
          },
        },
      ],
    }
    config.getMonikerConfig = jest.fn().mockResolvedValueOnce(monikerRes)
    const output = await parseMonikerinCmd(args, "guild_id")
    expect(output).toEqual(expected)
  })
})

// classifyTipSyntaxTargets - check list of discord ids are all valid
test.each([
  [
    "<@333116155826929671>",
    { targets: ["<@333116155826929671>"], isValid: true },
  ],
  [
    "<@333116155826929671> <@333116155826929672> <@333116155826929673>",
    {
      targets: [
        "<@333116155826929671>",
        "<@333116155826929672>",
        "<@333116155826929673>",
      ],
      isValid: true,
    },
  ],
  // tip channel
  [
    "<#333116155826929671>",
    { targets: ["<#333116155826929671>"], isValid: true },
  ],
  // tip role
  [
    "<@&1022071198651269150>",
    { targets: ["<@&1022071198651269150>"], isValid: true },
  ],
  // invalid id
  ["<:asd:642702608393568256>", { targets: [], isValid: false }],
])("defi.classifyTipSyntaxTargets(%o)", (input, output) => {
  expect(classifyTipSyntaxTargets(input)).toStrictEqual(output)
})
