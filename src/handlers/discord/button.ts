import {
  ButtonInteraction,
  CollectorFilter,
  CommandInteraction,
  Message,
  MessageOptions,
  Constants,
} from "discord.js"
import { authorFilter } from "utils/common"
import { wrapError } from "utils/wrap-error"
import { getPaginationRow } from "../../ui/discord/button"

export function listenForPaginateInteraction(
  interaction: CommandInteraction,
  render: (
    interaction: CommandInteraction,
    pageIdx: number,
  ) => Promise<{ messageOptions: MessageOptions }>,
  withAttachmentUpdate?: boolean,
  withMultipleComponents?: boolean,
) {
  const operators: Record<string, number> = {
    "+": 1,
    "-": -1,
  }

  interaction.channel
    ?.createMessageComponentCollector({
      componentType: Constants.MessageComponentTypes.BUTTON,
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
  originalMsg: Message | CommandInteraction,
  render: (pageIdx: number) => Promise<{ messageOptions: MessageOptions }>,
  withAttachmentUpdate?: boolean,
  withMultipleComponents?: boolean,
  filter?: CollectorFilter<[ButtonInteraction]>,
) {
  const operators: Record<string, number> = {
    "+": 1,
    "-": -1,
  }
  replyMsg
    .createMessageComponentCollector({
      componentType: Constants.MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: filter
        ? filter
        : authorFilter(originalMsg?.member?.user.id ?? ""),
    })
    .on("collect", (i) => {
      wrapError(originalMsg, async () => {
        const [pageStr, opStr, totalPage] = i.customId.split("_").slice(1)
        const page = +pageStr + operators[opStr]
        const {
          messageOptions: { embeds, components, files },
        } = await render(page)
        const msgComponents = withMultipleComponents
          ? components
          : getPaginationRow(page, +totalPage)
        await i.deferUpdate()
        if (withAttachmentUpdate && files?.length) {
          await replyMsg.removeAttachments()
          await i
            .editReply({
              embeds,
              components: msgComponents,
              files,
            })
            .catch(() => null)
        } else {
          await i
            .editReply({
              embeds,
              components: msgComponents,
            })
            .catch(() => null)
        }
      })
    })
    .on("end", () => {
      replyMsg.edit({ components: [] }).catch(() => null)
    })
}
