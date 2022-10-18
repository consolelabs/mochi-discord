import { Command } from "types/common"
import { PREFIX, STARBOARD_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { GuildIdNotFoundError } from "errors"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import config from "adapters/config"
import { authorFilter, paginate, emojis } from "utils/common"
import { MessageComponentTypes } from "discord.js/typings/enums"

const pageSize = 10
let currentView = "message"

function buildSwitchViewActionRow(currentView: string) {
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
  currentView: string,
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

async function composeMessage(
  msg: Message,
  data: any[],
  type: string,
  page: number
) {
  data.sort((a, b) => {
    const aName = msg.guild?.channels.cache.get(a.repost_channel_id)?.name
    const bName = msg.guild?.channels.cache.get(b.repost_channel_id)?.name
    if (aName && bName) {
      return aName.localeCompare(bName)
    }
    return 0
  })

  let fields: any[] = []
  console.log(data)
  fields = data.map((conf: any) => ({
    quantity: conf.quantity,
    emoji: conf.emoji,
    emojiStart: conf.emoji_start,
    emojiStop: conf.emoji_stop ?? "",
    channel: `<#${conf.repost_channel_id}>`,
  }))

  fields = paginate(fields, pageSize)
  fields = fields.map((batch: any[], idx: number) => {
    let quantityVal = ""
    let emojiVal = ""
    let emojiStartVal = ""
    let emojiStopVal = ""
    let channelVal = ""
    const embed = composeEmbedMessage(msg, {
      title: "Starboard Configuration",
      withoutFooter: true,
      thumbnail: msg.guild?.iconURL(),
    }).setFooter(`Page ${idx + 1} / ${fields.length}`)

    batch.forEach((f: any) => {
      quantityVal = quantityVal + f.quantity + "\n"
      emojiVal = emojiVal + f.emoji + "\n"
      emojiStartVal = emojiStartVal + f.emojiStart + "\n"
      emojiStopVal = emojiStopVal + f.emojiStop + "\n"
      channelVal = channelVal + f.channel + "\n"
    })

    if (type == "conversation") {
      return embed.setFields([
        { name: "Repost channel", value: channelVal, inline: true },
        { name: "Emoji Start", value: emojiStartVal, inline: true },
        { name: "Emoji Stop", value: emojiStopVal, inline: true },
      ])
    }
    return embed.setFields([
      { name: "Repost channel", value: channelVal, inline: true },
      { name: "Emoji", value: emojiVal, inline: true },
      { name: "Quantity", value: quantityVal, inline: true },
    ])
  })

  const totalPage = Math.ceil(data.length / pageSize)
  return {
    embeds: [fields[page]],
    components: [
      ...buildPaginationActionRow(currentView, page, totalPage),
      buildSwitchViewActionRow(currentView),
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
  currentView = i.customId.split("/").pop() ?? "message"

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
      res.data as any[],
      currentView,
      0
    ))
  }

  await i
    .editReply({
      embeds: embeds,
      components: components,
    })
    .catch(() => null)
}

async function handlePagination(i: ButtonInteraction, msg: Message) {
  const [currentView, pageStr, opStr] = i.customId.split("/").slice(1)
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
      res.data as any[],
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
  brief: "List all active starboard configurations",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const res = await config.listAllRepostReactionConfigs(
      msg.guild?.id ?? "",
      currentView ?? "message"
    )
    if (!res.ok || !res.data?.length) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "Starboard Configuration",
              description: "No configuration found.",
            }),
          ],
          components: [buildSwitchViewActionRow(currentView)],
        },
      }
    }

    const { embeds, components } = await composeMessage(
      msg,
      res.data as any[],
      currentView,
      0
    )
    const reply = await msg.reply({
      embeds: embeds,
      components: components,
    })
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
