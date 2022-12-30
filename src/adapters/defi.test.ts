import defi from "./defi"

// parseTipParameters - only used for minimum tip syntax
test.each([
  [
    ["tip", "@user", "1", "ftm"],
    { amountArg: "1", cryptocurrency: "FTM", each: false },
  ],
  // tip multiple
  [
    ["tip", "@user1", "@user2", "2", "ftm"],
    { amountArg: "2", cryptocurrency: "FTM", each: false },
  ],
  // tip multiple each
  [
    ["tip", "@user", "@user2", "1", "ftm", "each"],
    { amountArg: "1", cryptocurrency: "FTM", each: true },
  ],
  [
    ["tip", "@user", "1", "ftm", "message"],
    { amountArg: "ftm", cryptocurrency: "MESSAGE", each: false }, // expected failure
  ],
])("defi.parseTipParameters(%o)", (input, output) => {
  expect(defi.parseTipParameters(input)).toStrictEqual(output)
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
  expect(defi.classifyTipSyntaxTargets(input)).toStrictEqual(output)
})
