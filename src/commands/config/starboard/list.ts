import { Command } from "types/common"
import { PREFIX, STARBOARD_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { APIError, GuildIdNotFoundError } from "errors"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import config from "adapters/config"
import { authorFilter, emojis, getEmoji } from "utils/common"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { ModelGuildConfigRepostReaction } from "types/api"
import chunk from "lodash.chunk"

const pageSize = 10

type ReactionType = "message" | "conversation"

// repost_channel_id -> list of configs
type AggregatedData = Record<
  string,
  Array<{ start: string; stop: string } | { quantity: number; emoji: string }>
>

function aggregateData(
  data: Array<ModelGuildConfigRepostReaction>
): AggregatedData {
  return data.reduce((acc, c) => {
    let channel = acc[c.repost_channel_id ?? ""]
    if (!channel) {
      channel = []
      acc[c.repost_channel_id ?? ""] = channel
    }

    if (c.reaction_type === "message") {
      channel.push({
        emoji: c.emoji ?? "",
        quantity: c.quantity ?? 0,
      })
    } else {
      channel.push({
        start: c.emoji_start ?? "",
        stop: c.emoji_stop ?? "",
      })
    }

    return acc
  }, {} as AggregatedData)
}

function buildSwitchViewActionRow(currentView: ReactionType) {
  const messageButton = new MessageButton({
    label: "Message",
    emoji: emojis.MESSAGE,
    customId: "starboard-switch-view-button/message",
    style: "SECONDARY",
    disabled: currentView === "message",
  })
  const conversationButton = new MessageButton({
    label: "Conversation",
    emoji: emojis.CONVERSATION,
    customId: "starboard-switch-view-button/conversation",
    style: "SECONDARY",
    disabled: currentView === "conversation",
  })
  return new MessageActionRow().addComponents([
    messageButton,
    conversationButton,
  ])
}

function buildPaginationActionRow(
  currentView: ReactionType,
  page: number,
  totalPage: number
) {
  if (totalPage === 1) return []
  const row = new MessageActionRow()
  if (page !== 0) {
    row.addComponents(
      new MessageButton({
        type: MessageComponentTypes.BUTTON,
        style: "PRIMARY",
        label: "Previous",
        customId: `starboard-pagination-button/${currentView}/${page}/-/${totalPage}`,
      })
    )
  }

  if (page !== totalPage - 1) {
    row.addComponents({
      type: MessageComponentTypes.BUTTON,
      style: "PRIMARY",
      label: "Next",
      customId: `starboard-pagination-button/${currentView}/${page}/+/${totalPage}`,
    })
  }
  return [row]
}

function renderSingleView(data: AggregatedData) {
  return Object.entries(data)
    ?.sort((a, b) => {
      return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0
    })
    ?.map(
      (c) =>
        `<#${c[0]}>\n${c[1]
          ?.map((config) => {
            if ("emoji" in config) {
              return `${getEmoji("blank")}${getEmoji("reply")} ${
                config.quantity
              } emoji${config.quantity > 1 ? "es" : ""} ${config.emoji}`
            }
          })
          .filter(Boolean)
          .join("\n")}`
    )
    .join("\n\n")
}

function renderStartStopView(data: AggregatedData) {
  return Object.entries(data)
    ?.sort((a, b) => {
      return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0
    })
    ?.map(
      (c) =>
        `<#${c[0]}>\n${c[1]
          ?.map((config) => {
            if ("start" in config) {
              return `${getEmoji("blank")}${getEmoji("reply")} Start with ${
                config.start
              } End with ${config.stop}`
            }
          })
          .filter(Boolean)
          .join("\n")}`
    )
    .join("\n\n")
}

async function composeMessage(
  msg: Message,
  data: Array<ModelGuildConfigRepostReaction>,
  type: ReactionType,
  page: number
) {
  data.sort((a, b) => {
    const aName = msg.guild?.channels.cache.get(
      a?.repost_channel_id ?? ""
    )?.name
    const bName = msg.guild?.channels.cache.get(
      b?.repost_channel_id ?? ""
    )?.name
    if (aName && bName) {
      return aName.localeCompare(bName)
    }
    return 0
  })

  const paginated = chunk(data, pageSize)
  const pages = paginated.map((pageData, idx: number) => {
    const embed = composeEmbedMessage(msg, {
      title: "Starboard Configuration",
      withoutFooter: true,
      thumbnail: msg.guild?.iconURL(),
    })

    if (type === "conversation") {
      embed.setDescription(renderStartStopView(aggregateData(pageData)))
    } else {
      embed.setDescription(renderSingleView(aggregateData(pageData)))
    }

    embed.setDescription(`**Repost channel**\n${embed.description}`)
    embed.setFooter(`Page ${idx + 1} / ${paginated.length}`)
    return embed
  })

  const totalPage = Math.ceil(data.length / pageSize)
  return {
    embeds: [pages[page]],
    components: [
      ...buildPaginationActionRow(type, page, totalPage),
      buildSwitchViewActionRow(type),
    ],
  }
}

function collectButton(msg: Message, authorId: string) {
  return msg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: authorFilter(authorId),
    })
    .on("collect", async (i) => {
      const buttonType = i.customId.split("/").shift()
      switch (buttonType) {
        case "starboard-switch-view-button":
          await switchView(i, msg)
          break
        case "starboard-pagination-button":
          await handlePagination(i, msg)
          break
      }
    })
    .on("end", () => {
      msg.edit({ components: [] }).catch(() => null)
    })
}

async function switchView(i: ButtonInteraction, msg: Message) {
  let embeds: MessageEmbed[] = []
  let components: MessageActionRow[] = []
  const nextView = (i.customId.split("/").pop() ?? "message") as ReactionType

  const res = await config.listAllRepostReactionConfigs(
    msg.guild?.id ?? "",
    nextView
  )

  if (!res.ok) {
    throw new APIError({ curl: res.curl, description: res.log })
  }

  if (!res.data?.length) {
    embeds = [
      composeEmbedMessage(msg, {
        title: "Starboard Configuration",
        description: "No configuration found.",
      }),
    ]
    components = [buildSwitchViewActionRow(nextView)]
  } else {
    ;({ embeds, components } = await composeMessage(msg, res.data, nextView, 0))
  }

  await i
    .editReply({
      embeds: embeds,
      components: components,
    })
    .catch(() => null)
}

async function handlePagination(i: ButtonInteraction, msg: Message) {
  const [currentView, pageStr, opStr] = i.customId.split("/").slice(1) as [
    ReactionType,
    string,
    string
  ]
  let embeds: MessageEmbed[] = []
  let components: MessageActionRow[] = []
  const operators: Record<string, number> = {
    "+": 1,
    "-": -1,
  }
  const page = +pageStr + operators[opStr]

  const res = await config.listAllRepostReactionConfigs(
    msg.guild?.id ?? "",
    currentView
  )
  if (!res.ok || !res.data?.length) {
    embeds = [
      composeEmbedMessage(msg, {
        title: "Starboard Configuration",
        description: "No configuration found.",
      }),
    ]
    components = [buildSwitchViewActionRow(currentView)]
  } else {
    ;({ embeds, components } = await composeMessage(
      msg,
      res.data,
      currentView,
      page
    ))
  }

  await i
    .editReply({
      embeds: embeds,
      components: components,
    })
    .catch(() => null)
}

const command: Command = {
  id: "starboard_list",
  command: "list",
  brief: "List all bookmark in the starboard.",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const defaultView: ReactionType = "message"

    const res = await config.listAllRepostReactionConfigs(
      msg.guild?.id ?? "",
      defaultView
    )
    if (!res.ok) {
      throw new APIError({
        curl: res.curl,
        description: res.log,
      })
    }
    let reply
    if (!res.data?.length) {
      reply = await msg.reply({
        embeds: [
          composeEmbedMessage(msg, {
            title: "Starboard Configuration",
            description: "No configuration found.",
          }),
        ],
        components: [buildSwitchViewActionRow(defaultView)],
      })
    } else {
      const { embeds, components } = await composeMessage(
        msg,
        res.data,
        defaultView,
        0
      )
      reply = await msg.reply({
        embeds: embeds,
        components: components,
      })
    }

    collectButton(reply, msg.author.id)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}sb list`,
          examples: `${PREFIX}sb list`,
          document: `${STARBOARD_GITBOOK}&action=list`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
