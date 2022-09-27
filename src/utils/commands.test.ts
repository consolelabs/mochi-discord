import { getReactionIdentifier } from "./commands"

test.each([
  // normal case
  [
    { emojiId: "1022726852034445333", emojiName: "grinning", identifier: "grinning" },
    { reaction: "<:grinning>" },
  ]

])("getReactionIdentifier(%o)", (input, output) => {
  expect(getReactionIdentifier(input.emojiId, input.emojiName, input.identifier)).toStrictEqual(output.reaction)
})
