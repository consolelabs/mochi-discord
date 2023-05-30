import profile from "adapters/profile"
import {
  authorFilter,
  EmojiKey,
  emojis,
  getEmoji,
  getEmojiURL,
  msgColors,
} from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  Message,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  User,
} from "discord.js"
import { logger } from "logger"
import CacheManager from "cache/node-cache"
import { capitalCase } from "change-case"
import { wrapError } from "utils/wrap-error"
import { getSlashCommand } from "utils/commands"
import { getPaginationRow } from "ui/discord/button"

CacheManager.init({
  pool: "user_inbox",
  ttl: 300,
  checkperiod: 300,
})

const emojisMap = {
  quest: getEmoji("QUEST"),
  price_alert_up: getEmoji("ANIMATED_CHART_INCREASE", true),
  price_alert_down: getEmoji("ANIMATED_CHART_DECREASE", true),
  tip: getEmoji("CASH"),
  xp: getEmoji("GIFT"),
}

type View = "unread" | "read"

export async function render(
  userDiscordId: string,
  page: number,
  view: View = "unread"
) {
  const dataProfile = await profile.getByDiscord(userDiscordId)
  if (dataProfile.err) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
    })
  }
  if (!dataProfile)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No activities found",
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} This user does not have any activities yet`,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }

  const {
    data,
    pagination: { total },
  } = await CacheManager.get({
    pool: "user_inbox",
    key: `${userDiscordId}_${page}`,
    call: async () => await profile.getUserActivities(dataProfile.id, page),
  })

  if (!data.length)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No activities found",
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} This user does not have any activities yet`,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }

  // const now = new Date()
  // const unreadList = data.filter((activity: any) => {
  //   return activity.status === "new"
  // })
  // const readList = data.filter((activity: any) => {
  //   // const date = new Date(activity.created_at)
  //   return (
  //     activity.status === "read"
  //     // date.getMonth() === now.getMonth() &&
  //     // date.getFullYear() === now.getFullYear() &&
  //     // date.getDate() === now.getDate()
  //   )
  // })

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
  if (view === "read") {
    // TODO mock only, replace with real logic
    list = []
  }

  let description = toDescriptionList(list.slice(0, 10))

  // auto switch to read view if unread is empty
  if (!list.length) {
    view = "read"
    description = toDescriptionList([].slice(0, 10))
  }

  const embed = composeEmbedMessage(null, {
    author: ["Inbox", getEmojiURL(emojis.BELL)],
  })

  if (list.length) {
    embed.setFields({
      name: `${capitalCase(view)} \`${list.length}\``,
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

  // mark read the inbox but ignore error
  const ids = list.map((activity: any) => activity.id).filter(Boolean)
  await profile.markReadActivities(dataProfile.id, { ids }).catch((error) => {
    logger.error("fail to mark read inbox", error)
  })

  const paginationBtns = getPaginationRow(page, total, {
    extra: view,
    left: { label: "", emoji: getEmoji("LEFT_ARROW") },
    right: { label: "", emoji: getEmoji("RIGHT_ARROW") },
  })
  // const [left, right] = paginationBtns.components

  return {
    messageOptions: {
      embeds: [embed],
      components: [
        ...(list.length
          ? [
              new MessageActionRow().addComponents(
                new MessageSelectMenu()
                  .setPlaceholder("🔔 View a message")
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
          // ...(left && right ? [left] : []),
          new MessageButton({
            label: "Unread",
            style: "SECONDARY",
            emoji: "<:pepe_ping:1028964391690965012>",
            customId: "inbox_unread",
            disabled: view === "unread",
          }),
          new MessageButton({
            label: "Read",
            style: "SECONDARY",
            emoji: "<:pepeold:940971200044204142>",
            customId: "inbox_read",
            disabled: view === "read",
          })
          // ...(left || right ? (left && right ? [right] : [left]) : [])
        ),
        ...paginationBtns,
      ],
    },
  }
}

export function collectButton(reply: Message, author: User) {
  reply
    .createMessageComponentCollector({
      componentType: "BUTTON",
      filter: authorFilter(author.id),
      time: 300000,
    })
    .on("collect", (i) => {
      wrapError(reply, async () => {
        if (!i.deferred) {
          await i.deferUpdate().catch(() => null)
        }
        const [action, ...rest] = i.customId.split("_")
        let msgOpts
        if (action === "page") {
          const [curPage, dir, , view] = rest
          if (dir === "+") {
            msgOpts = await render(author.id, Number(curPage) + 1, view as View)
          } else {
            msgOpts = await render(author.id, Number(curPage) - 1, view as View)
          }
        } else {
          const [view] = rest
          msgOpts = await render(author.id, 0, view as View)
        }

        i.editReply(msgOpts.messageOptions)
      })
    })
    .on("end", () => {
      wrapError(reply, async () => {
        await reply.edit({ components: [] }).catch(() => null)
      })
    })
}

function toDescriptionList(list: any[], offset = 0) {
  const description = list
    .map((el: any, i: number) => {
      const date = new Date(el.created_at)
      const t = `<t:${Math.floor(date.getTime() / 1000)}:R>`

      return `${getEmoji(`NUM_${i + 1 + offset}` as EmojiKey)} ${t} ${
        emojisMap[el.action as keyof typeof emojisMap]
      } ${el.action_description}`
    })
    .join("\n")

  return description
}
