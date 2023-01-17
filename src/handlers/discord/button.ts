import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageOptions,
  SelectMenuInteraction,
} from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { authorFilter } from "utils/common"
import { wrapError } from "utils/wrap-error"
import { getPaginationRow } from "../../ui/discord/button"

export function listenForSuggestionAction(
  replyMsg: Message,
  authorId: string,
  onAction: (
    value: string,
    i: ButtonInteraction | SelectMenuInteraction
  ) => Promise<void>
) {
  replyMsg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: authorFilter(authorId),
    })
    .on("collect", async (i) => {
      const value = i.customId.split("-").pop()
      wrapError(i, async () => {
        await onAction(value ?? "", i)
      })
    })
    .on("end", () => {
      replyMsg.edit({ components: [] }).catch(() => null)
    })

  replyMsg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.SELECT_MENU,
      idle: 60000,
      filter: authorFilter(authorId),
    })
    .on("collect", async (i) => {
      const value = i.values[0]
      wrapError(i, async () => {
        await onAction(value, i)
      })
    })
    .on("end", () => {
      replyMsg.edit({ components: [] }).catch(() => null)
    })
}

export function listenForPaginateInteraction(
  interaction: CommandInteraction,
  render: (
    interaction: CommandInteraction,
    pageIdx: number
  ) => Promise<{ messageOptions: MessageOptions }>,
  withAttachmentUpdate?: boolean,
  withMultipleComponents?: boolean
) {
  const operators: Record<string, number> = {
    "+": 1,
    "-": -1,
  }

  interaction.channel
    ?.createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: authorFilter(interaction.user.id),
    })
    .on("collect", async (i) => {
      const [pageStr, opStr, totalPage] = i.customId.split("_").slice(1)
      const page = +pageStr + operators[opStr]
      const {
        messageOptions: { embeds, components, files },
      } = await render(interaction, page)

      const msgComponents = withMultipleComponents
        ? components
        : getPaginationRow(page, +totalPage)
      if (withAttachmentUpdate && files?.length) {
        await interaction
          .editReply({
            embeds,
            components: msgComponents,
            files,
          })
          .catch(() => null)
      } else {
        await interaction
          .editReply({
            embeds,
            components: msgComponents,
          })
          .catch(() => null)
      }
    })
    .on("end", () => {
      interaction.editReply({ components: [] }).catch(() => null)
    })
}

export function listenForPaginateAction(
  replyMsg: Message,
  originalMsg: Message,
  render: (
    msg: Message,
    pageIdx: number
  ) => Promise<{ messageOptions: MessageOptions }>,
  withAttachmentUpdate?: boolean,
  withMultipleComponents?: boolean
) {
  const operators: Record<string, number> = {
    "+": 1,
    "-": -1,
  }
  replyMsg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
    })
    .on("collect", async (i) => {
      await i.deferUpdate()
      const [pageStr, opStr, totalPage] = i.customId.split("_").slice(1)
      const page = +pageStr + operators[opStr]
      const {
        messageOptions: { embeds, components, files },
      } = await render(originalMsg, page)

      const msgComponents = withMultipleComponents
        ? components
        : getPaginationRow(page, +totalPage)
      if (withAttachmentUpdate && files?.length) {
        await replyMsg.removeAttachments()
        await replyMsg
          .edit({
            embeds,
            components: msgComponents,
            files,
          })
          .catch(() => null)
      } else {
        await replyMsg
          .edit({
            embeds,
            components: msgComponents,
          })
          .catch(() => null)
      }
    })
    .on("end", () => {
      replyMsg.edit({ components: [] }).catch(() => null)
    })
}
