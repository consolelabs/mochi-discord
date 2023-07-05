import {
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  Constants,
} from "discord.js"
import { getEmoji } from "utils/common"

export function getExitButton(authorId: string, label?: string) {
  return new MessageButton({
    customId: `exit-${authorId}`,
    emoji: getEmoji("REVOKE"),
    style: "DANGER",
    label: label ?? "Exit",
  })
}

export function composeDiscordExitButton(
  authorId: string,
  label?: string
): MessageActionRow {
  return new MessageActionRow().addComponents(getExitButton(authorId, label))
}

export function composeButtonLink(
  label: string,
  url: string,
  emoji?: string
): MessageActionRow {
  const row = new MessageActionRow().addComponents(
    new MessageButton({
      style: Constants.MessageButtonStyles.LINK,
      label,
      url,
      emoji,
    })
  )

  return row
}

export async function renderPaginator(msg: Message, pages: MessageEmbed[]) {
  if (!pages.length) return
  let page = 0
  const forwardBtn = new MessageButton()
    .setCustomId("FORWARD_BTN")
    .setLabel("Next")
    .setStyle("SECONDARY")
    .setEmoji(getEmoji("RIGHT_ARROW"))
  const backwardBtn = new MessageButton()
    .setCustomId("BACKWARD_BTN")
    .setLabel("Previous")
    .setEmoji(getEmoji("LEFT_ARROW"))
    .setStyle("SECONDARY")
  const row = new MessageActionRow().addComponents([backwardBtn, forwardBtn])

  const message = await msg.channel.send({
    embeds: [pages[page]],
    components: [row],
  })

  const collector = message.createMessageComponentCollector({
    componentType: "BUTTON",
    time: 20000,
  })

  collector.on("collect", async (i) => {
    await i.deferUpdate()
    if (i.user.id !== msg.author.id) return
    if (i.customId === "FORWARD_BTN") {
      page = page > 0 ? page - 1 : pages.length - 1
      await message
        .edit({ embeds: [pages[page]], components: [row] })
        .catch(() => null)
    }
    if (i.customId === "BACKWARD_BTN") {
      page = page < pages.length - 1 ? page + 1 : 0
      await message
        .edit({ embeds: [pages[page]], components: [row] })
        .catch(() => null)
    }
  })
}

export function getPaginationRow(
  page: number,
  totalPage: number,
  options = {
    extra: "",
    left: { label: "Previous", emoji: "" },
    right: { label: "Next", emoji: "" },
  }
) {
  if (totalPage === 1) return []
  const actionRow = new MessageActionRow()
  if (page !== 0) {
    actionRow.addComponents(
      new MessageButton({
        type: Constants.MessageComponentTypes.BUTTON,
        style: Constants.MessageButtonStyles.SECONDARY,
        emoji: options.left.emoji || undefined,
        label: options.left.label,
        customId: `page_${page}_-_${totalPage}${
          options.extra ? `_${options.extra}` : ""
        }`,
      })
    )
  }

  if (page !== totalPage - 1) {
    actionRow.addComponents({
      type: Constants.MessageComponentTypes.BUTTON,
      style: Constants.MessageButtonStyles.SECONDARY,
      emoji: options.right.emoji || undefined,
      label: options.right.label,
      customId: `page_${page}_+_${totalPage}${
        options.extra ? `_${options.extra}` : ""
      }`,
    })
  }
  return [actionRow]
}
