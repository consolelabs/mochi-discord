import config from "./config"
import defi from "./defi"

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
    const output = await defi.parseMonikerinCmd(args, "guild_id")
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
    const output = await defi.parseMonikerinCmd(args, "guild_id")
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
    const output = await defi.parseMonikerinCmd(args, "guild_id")
    expect(output).toEqual(expected)
  })
})

describe("parseMessageTip", () => {
  test("parse text", async () => {
    const args = ["tip", "@user", "1", "ftm", "test message"]
    const expected = {
      newArgs: ["tip", "@user", "1", "ftm"],
      messageTip: "test message",
    }
    const allTokenRes = {
      ok: true,
      data: [{ token_symbol: "ftm" }],
      log: "",
      curl: "",
    }

    defi.getAllTipBotTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await defi.parseMessageTip(args)
    expect(output).toEqual(expected)
  })
  test("parse text in quotes", async () => {
    const args = ["tip", "@user", "1", "ftm", `\"test message\"`]
    const expected = {
      newArgs: ["tip", "@user", "1", "ftm"],
      messageTip: "test message",
    }
    const allTokenRes = {
      ok: true,
      data: [{ token_symbol: "ftm" }],
      log: "",
      curl: "",
    }

    defi.getAllTipBotTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await defi.parseMessageTip(args)
    expect(output).toEqual(expected)
  })
  test("parse text in single quotes", async () => {
    const args = ["tip", "@user", "1", "ftm", `\'test message\'`]
    const expected = {
      newArgs: ["tip", "@user", "1", "ftm"],
      messageTip: "test message",
    }
    const allTokenRes = {
      ok: true,
      data: [{ token_symbol: "ftm" }],
      log: "",
      curl: "",
    }

    defi.getAllTipBotTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await defi.parseMessageTip(args)
    expect(output).toEqual(expected)
  })
  test("parse no message", async () => {
    const args = ["tip", "@user", "1", "ftm"] // no message to changes to args
    const expected = {
      newArgs: ["tip", "@user", "1", "ftm"],
      messageTip: "",
    }
    const allTokenRes = {
      ok: true,
      data: [{ token_symbol: "ftm" }],
      log: "",
      curl: "",
    }

    defi.getAllTipBotTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await defi.parseMessageTip(args)
    expect(output).toEqual(expected)
  })
  test("parse invalid token", async () => {
    const args = ["tip", "@user", "1", "cake"] // does not consider token valid
    const expected = {
      newArgs: ["tip", "@user", "1", "cake"],
      messageTip: "",
    }
    const allTokenRes = {
      ok: true,
      data: [{ token_symbol: "ftm" }],
      log: "",
      curl: "",
    }

    defi.getAllTipBotTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await defi.parseMessageTip(args)
    expect(output).toEqual(expected)
  })
})
