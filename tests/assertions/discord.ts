import { MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"

export function assertRunResult(
  output: RunResult<MessageOptions>,
  expected: RunResult<MessageOptions>
) {
  // no need to assert timestamp
  if (output?.messageOptions?.embeds?.[0]) {
    output.messageOptions.embeds[0].timestamp = null
  }
  if (expected?.messageOptions?.embeds?.[0]) {
    expected.messageOptions.embeds[0].timestamp = null
  }
  expect(output.messageOptions.embeds).toStrictEqual(
    expected.messageOptions.embeds
  )
  expect(output.messageOptions.components).toStrictEqual(
    expected.messageOptions.components
  )
  expect(output.messageOptions.content).toStrictEqual(
    expected.messageOptions.content
  )
  expect(output.messageOptions.files).toStrictEqual(
    expected.messageOptions.files
  )
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

export function assertTitle(
  output: RunResult<MessageOptions>,
  expected: MessageEmbed
) {
  expect(output?.messageOptions?.embeds?.[0].title).toStrictEqual(
    expected.title
  )
}
