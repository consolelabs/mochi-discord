import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  MessageSelectMenuOptions,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { SetDefaultButtonHandler, SetDefaultRenderList } from "types/common"
import { InteractionHandler } from "handlers/discord/select-menu"
import {
  EmojiKey,
  getAuthor,
  getDateStr,
  getEmoji,
  hasAdministrator,
} from "utils/common"
import { VERTICAL_BAR } from "utils/constants"
import { composeEmbedMessage } from "./embed"
import dayjs from "dayjs"

type SetDefaultMiddlewareParams<T> = {
  render: SetDefaultRenderList<T>
  label: string
  onDefaultSet?: SetDefaultButtonHandler
  // for slash command case
  commandInteraction?: CommandInteraction
}

export function setDefaultMiddleware<T>(params: SetDefaultMiddlewareParams<T>) {
  return <InteractionHandler>(async (i: SelectMenuInteraction) => {
    const selectedValue = i.values[0]
    const interactionMsg = i.message as Message
    const member = await interactionMsg.guild?.members.fetch(i.user.id)
    const isAdmin = hasAdministrator(member)
    let originalMsg = null
    let replyMessage
    if (interactionMsg.reference) {
      originalMsg = await interactionMsg.fetchReference()
    } else if (params.commandInteraction) {
      originalMsg = params.commandInteraction
    }

    if (!originalMsg) return
    if (!params.onDefaultSet && isAdmin) await i.deferUpdate()
    if (params.onDefaultSet && isAdmin) {
      await i.deferReply({ ephemeral: true }).catch(() => null)
    }
    const render = await params.render({
      // TODO(tuan): i don't know how to solve this (yet)
      msgOrInteraction: originalMsg as any,
      value: selectedValue,
    })
    if (isAdmin) {
      if (!params.onDefaultSet) {
        return { ...render }
      }

      const actionRow = new MessageActionRow().addComponents(
        new MessageButton({
          customId: selectedValue,
          emoji: getEmoji("CHECK"),
          style: "SUCCESS",
          label: "Confirm",
        }),
      )

      const author = getAuthor(originalMsg)
      const embedProps = {
        title: "Set default",
        description: `Do you want to set **${params.label}** as the default value for this command?\nNo further selection next time use command`,
        originalMsgAuthor: author,
      }

      replyMessage = {
        embeds: [composeEmbedMessage(null, embedProps)],
        components: [actionRow],
      }
    }

    return {
      ...render,
      replyMessage,
      buttonCollector: { handler: params.onDefaultSet },
    }
  })
}

/**
 * Returns a formatted string of options (maximum 8)
 *
 * @param {string[]} options Array of option strings
 *
 * @return {string} Formatted string
 * */
export function composeSimpleSelection(
  options: string[],
  customRender?: (o: string, i: number) => string,
): string {
  return `${options
    .slice(0, 8)
    .map((o, i) =>
      customRender
        ? customRender(o, i)
        : `${getEmoji(`NUM_${i + 1}` as EmojiKey)}${VERTICAL_BAR}${o}`,
    )
    .join("\n")}`
}

export function composeDiscordSelectionRow(
  options: MessageSelectMenuOptions = {},
): MessageActionRow {
  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu(options),
  )

  return row
}

export function getSuggestionComponents(
  suggestions: Array<MessageSelectOptionData>,
) {
  if (suggestions.length === 0) return
  const hasOneSuggestion = suggestions.length === 1
  const row = new MessageActionRow()
  if (hasOneSuggestion) {
    const button = new MessageButton()
      .setLabel("Yes")
      .setStyle("SUCCESS")
      .setCustomId(`suggestion-button-${suggestions[0].value}`)
    row.addComponents(button)
  } else {
    const select = new MessageSelectMenu()
      .setPlaceholder("Other options")
      .addOptions(suggestions)
      .setCustomId("suggestion-select")
    row.addComponents(select)
  }

  return row
}

export function composeDaysSelectMenu(
  customId: string,
  days: number[],
  defaultVal?: number,
) {
  const getDropdownOptionDescription = (days: number) =>
    `${getDateStr(dayjs().subtract(days, "day").unix() * 1000)} - ${getDateStr(
      dayjs().unix() * 1000,
    )}`
  const labeling = (days: number) => {
    if (days < 365) return `${days} day${days > 1 ? "s" : ""}`
    const y = days / 365
    return `${y} year${y > 1 ? "s" : ""}`
  }
  const opt = (days: number): MessageSelectOptionData => ({
    label: labeling(days),
    value: days.toString(),
    emoji: days > 1 ? "📆" : "🕒",
    description: getDropdownOptionDescription(days),
    default: days === (defaultVal ?? 7),
  })
  const selectRow = composeDiscordSelectionRow({
    customId,
    placeholder: "Make a selection",
    options: days.map((d) => opt(d)),
  })
  return selectRow
}

export function composeOtherTickerSelectMenu(
  customId: string,
  remainingCoins: any[],
) {
  const opt = (coin: any): MessageSelectOptionData => ({
    label: coin.id.toUpperCase() + " | $" + coin.current_price,
    value: coin.id,
  })
  const selectRow = composeDiscordSelectionRow({
    customId,
    placeholder: "Make a selection",
    options: remainingCoins.map((c) => opt(c)),
  })
  return selectRow
}
