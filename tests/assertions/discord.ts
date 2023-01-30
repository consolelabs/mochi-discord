import { MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"

export function assertRunResult(
  output: RunResult<MessageOptions>,
  expected: RunResult<MessageOptions>
) {
  expect(output).toStrictEqual(expected)
}

export function assertThumbnail(
  output: RunResult<MessageOptions>,
  expected: MessageEmbed
) {
  expect(output?.messageOptions?.embeds?.[0].thumbnail).toStrictEqual(
    expected.thumbnail
  )
}

export function assertAuthor(
  output: RunResult<MessageOptions>,
  expected: MessageEmbed
) {
  expect(output?.messageOptions?.embeds?.[0].author).toStrictEqual(
    expected.author
  )
}

export function assertDescription(
  output: RunResult<MessageOptions>,
  expected: MessageEmbed
) {
  expect(output?.messageOptions?.embeds?.[0].description).toStrictEqual(
    expected.description
  )
}
