import profile from "adapters/profile"
import {
  capitalizeFirst,
  EmojiKey,
  emojis,
  getEmoji,
  getEmojiURL,
} from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { MessageActionRow, MessageButton, MessageSelectMenu } from "discord.js"
import { getSlashCommand } from "utils/commands"
import { ActionTypeToEmoji } from "utils/activity"
import { paginationButtons } from "utils/router"

export enum View {
  Unread = "unread",
  Read = "read",
}

type Context = {
  view: View
  page: number
}

const PAGE_SIZE = 5

export async function render(userDiscordId: string, ctx: Context) {
  const dataProfile = await profile.getByDiscord(userDiscordId)
  if (dataProfile.err || !dataProfile.id) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
      status: dataProfile.status ?? 500,
      error: dataProfile.error,
    })
  }

  const profileId = dataProfile.id

  let list = []
  let status = "new"
  if (ctx.view === View.Read) {
    status = "read"
  }

  const { data, pagination } = await profile.getUserActivities(profileId, {
    status,
    // ["withdraw", "feedback", "tip", "verify"], // inbox only show these activities
    // TODO: feedback doesn't create a new activity
    // TODO: "verify"?
    // check mochi-typeset for enum
    actions: ["9", "10"],
    page: ctx.page,
    size: PAGE_SIZE,
  })

  if (data.length) {
    list = data
  }

  const total = pagination?.total ?? 0
  let remaining =
    total - (ctx.page + 1) * PAGE_SIZE < 0
      ? 0
      : total - (ctx.page + 1) * PAGE_SIZE
  if (ctx.view === View.Read) {
    remaining = total
  }

  const description = toDescriptionList(list.slice(0, PAGE_SIZE))

  const embed = composeEmbedMessage(null, {
    author: ["Inbox", getEmojiURL(emojis.BELL)],
  })

  if (list.length) {
    embed.setFields({
      name: `${capitalizeFirst(ctx.view)} \`${remaining}\``,
      value: description,
    })
  } else {
    embed.setDescription(
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} You don't have any new notifications, why not try ${await getSlashCommand(
        "withdraw",
      )} or ${await getSlashCommand("deposit")}\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} After that, maybe ${await getSlashCommand(
        "tip",
      )} some of your friends`,
    )
  }

  const ids = list.map((activity: any) => activity.id).filter(Boolean)
  await profile.markReadActivities(dataProfile.id, { ids }).catch(() => null)

  const totalPage = Math.ceil(total / PAGE_SIZE)

  return {
    context: ctx,
    msgOpts: {
      embeds: [embed],
      components: [
        ...(list.length
          ? [
              new MessageActionRow().addComponents(
                new MessageSelectMenu()
                  .setPlaceholder("🔔 Mark a message as read")
                  .setCustomId("inbox_view-activity")
                  .addOptions(
                    list.map((a, i: number) => ({
                      emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
                      label: `🟩 ${a.content}`,
                      value: `value-${i}-${a.content}`,
                    })),
                  ),
              ),
            ]
          : []),
        new MessageActionRow().addComponents(
          new MessageButton({
            label: "Unread",
            style: "SECONDARY",
            emoji: "<:pepe_ping:1028964391690965012>",
            customId: "view_unread_list",
            disabled: ctx.view === "unread",
          }),
          new MessageButton({
            label: "Read",
            style: "SECONDARY",
            emoji: "<:pepeold:940971200044204142>",
            customId: "view_read_list",
            disabled: ctx.view === "read",
          }),
        ),
        ...(ctx.view === View.Read
          ? paginationButtons(ctx.page, totalPage)
          : remaining > 0
          ? [
              new MessageActionRow().addComponents(
                new MessageButton({
                  style: "SECONDARY",
                  label: "\u200b",
                  customId: "see_next_unread",
                  emoji: getEmoji("RIGHT_ARROW"),
                }),
              ),
            ]
          : []),
      ],
    },
  }
}

function toDescriptionList(list: any[], offset = 0) {
  const description = list
    .map((el: any, i: number) => {
      const date = new Date(el.created_at)
      const t = `<t:${Math.floor(date.getTime() / 1000)}:R>`

      return `${getEmoji(`NUM_${i + 1 + offset}` as EmojiKey)} ${t} ${
        ActionTypeToEmoji(el.type) ?? getEmoji("ANIMATED_QUESTION_MARK", true)
      } ${el.content}`
    })
    .join("\n")

  return description
}
