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
import { paginationButtons } from "utils/router"

const emojisMap = {
  quest: getEmoji("QUEST"),
  price_alert_up: getEmoji("ANIMATED_CHART_INCREASE", true),
  price_alert_down: getEmoji("ANIMATED_CHART_DECREASE", true),
  tip: getEmoji("CASH"),
  xp: getEmoji("GIFT"),
}

const PAGE_SIZE = 2

export enum View {
  Unread = "unread",
  Read = "read",
}

type Context = {
  view: View
  page: number
}

export async function render(userDiscordId: string, ctx: Context) {
  const dataProfile = await profile.getByDiscord(userDiscordId)
  if (dataProfile.err || !dataProfile.id) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
    })
  }

  const profileId = dataProfile.id

  const { data, pagination } = await profile.getUnreadUserActivities(
    profileId,
    ctx.page,
    PAGE_SIZE
  )

  const total = pagination?.total ?? 0

  // TODO mock
  let list = [
    {
      created_at: new Date().toUTCString(),
      action: "quest",
      action_description: "Done quest: check any token price 3 times",
    },
    {
      created_at: new Date().toUTCString(),
      action: "price_alert_down",
      action_description: "FTM/USDT is below 0.5336",
    },
    {
      created_at: new Date().toISOString(),
      action: "tip",
      action_description: `<@151497832853929986> tipped you ${getEmoji(
        "FTM"
      )} 0.1 FTM`,
      action_label: "baddeed tipped you 0.1 FTM",
    },
  ]
  if (ctx.view === View.Read) {
    // TODO mock only, replace with real logic
    list = []
  }

  // replace mock with real data
  if (data.length) {
    list = data
  }

  const description = toDescriptionList(list.slice(0, 10))

  const embed = composeEmbedMessage(null, {
    author: ["Inbox", getEmojiURL(emojis.BELL)],
  })

  if (list.length) {
    embed.setFields({
      name: `${capitalizeFirst(ctx.view)} \`${list.length}\``,
      value: description,
    })
  } else {
    embed.setDescription(
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} You have no notifications, why not try ${await getSlashCommand(
        "withdraw"
      )} or ${await getSlashCommand("deposit")}\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} After that, maybe ${await getSlashCommand("tip")} some of your friends`
    )
  }

  // TODO this behavior cause pagination not working, should not change page number, because page number should always be 0
  // mark read the inbox but ignore error
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
                      label: `🟩 ${a.action_label ?? a.action_description}`,
                      value: `value-${i}-${a.action_description}`,
                    }))
                  )
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
          })
        ),
        ...(ctx.view === View.Read
          ? paginationButtons(ctx.page, totalPage)
          : list.length
          ? [
              new MessageActionRow().addComponents(
                new MessageButton({
                  style: "SECONDARY",
                  label: "\u200b",
                  customId: "see_next_unread",
                  emoji: getEmoji("RIGHT_ARROW"),
                })
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
        emojisMap[el.action as keyof typeof emojisMap] ??
        getEmoji("ANIMATED_QUESTION_MARK", true)
      } ${el.action_description}`
    })
    .join("\n")

  return description
}
