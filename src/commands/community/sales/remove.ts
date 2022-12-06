import { Command, embedsColors } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX, SALE_TRACKER_GITBOOK } from "utils/constants"
import {
  getErrorEmbed,
  composeEmbedMessage,
  getSuccessEmbed,
  composeSimpleSelection,
} from "utils/discordEmbed"
import community from "adapters/community"
import {
  ButtonInteraction,
  CommandInteraction,
  InteractionCollector,
  Message,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { authorFilter, getEmoji, shortenHashOrAddress } from "utils/common"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { APIError, InternalError } from "errors"

type State = "idle" | "queued" | "queued-detail" | "undo" | "undo-detail"

let buttonCollector: InteractionCollector<ButtonInteraction> | null = null

function remove(
  guildId: string,
  contractAddress: string,
  afterDeleteCallback: () => void
) {
  return global.setTimeout(() => {
    community
      .deleteSaleTracker(guildId, contractAddress)
      .then(afterDeleteCallback)
  }, 8000)
}

async function undo(i: ButtonInteraction) {
  const [, state, timeoutId] = i.customId.split("/") as [string, State, string]
  if (!Number.isNaN(+timeoutId)) {
    global.clearTimeout(+timeoutId)
    let options = []
    if (state === "queued" && i.guildId) {
      const res = await community.getSalesTrackers(i.guildId)
      if (res.ok) {
        options = res.data.collection
      }
    }
    const { embed, components } = renderResponse(
      state === "queued-detail" ? "undo-detail" : "undo",
      "Choose 1 from the list",
      options,
      i.channelId
    )
    i.editReply({
      embeds: [embed],
      ...(state === "queued-detail" ? { components: [] } : { components }),
    }).catch(() => null)
    buttonCollector?.stop()
    buttonCollector = null
  }
}

async function selectRemove(i: SelectMenuInteraction) {
  const [contractAddress] = i.values[0].split("/") as [string, string]
  if (i.guildId) {
    const res = await community.getSalesTrackers(i.guildId)
    if (res.ok) {
      const timeoutId = remove(i.guildId, contractAddress, () => {
        if (i.message instanceof Message) {
          i.message
            .edit({ components: [i.message.components[0]] })
            .catch(() => null)
        }
      })
      const { embed, components } = renderResponse(
        "queued",
        "Tracker removed",
        res.data.collection.filter(
          (c: any) => c.contract_address !== contractAddress
        ),
        i.channelId,
        timeoutId
      )
      const msg = await i
        .editReply({
          embeds: [embed],
          components,
        })
        .catch(() => null)
      buttonCollector = collectButton(msg as Message, i.user.id)
    }
  }
}

function collectButton(msg: Message, authorId: string) {
  if (buttonCollector) return buttonCollector
  return msg
    .createMessageComponentCollector({
      filter: authorFilter(authorId),
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
    })
    .once("collect", undo)
    .on("end", () => {
      buttonCollector = null
    })
}

function collectSelect(msg: Message, authorId: string) {
  msg
    .createMessageComponentCollector({
      filter: authorFilter(authorId),
      componentType: MessageComponentTypes.SELECT_MENU,
      idle: 60000,
    })
    .on("collect", selectRemove)
    .on("end", () => {
      msg.edit({ components: [] }).catch(() => null)
    })
}

function renderResponse(
  state: State,
  title: string,
  options: Array<{ contract_address: string; platform: string }>,
  channelId: string,
  buttonId?: NodeJS.Timeout
) {
  const row1 = new MessageActionRow()
  const row2 = new MessageActionRow()
  let select: MessageSelectMenu | null = null
  if (options.length > 0) {
    select = new MessageSelectMenu({
      customId: "select-remove-sale-tracker",
      options: options.map((o, i) => ({
        label: `$${shortenHashOrAddress(o.contract_address)} - ${o.platform}`,
        value: `${o.contract_address}/${o.platform}`,
        emoji: getEmoji(`NUM_${i + 1}`),
      })),
    })
  }
  const button = new MessageButton({
    label: "Undo",
    customId: `undo-remove-sale-tracker/${state}/${buttonId}`,
    style: "SECONDARY",
  })
  if (state !== "queued") {
    if ((state === "idle" || state === "undo") && select) {
      row1.addComponents(select)
    }
    if (state === "queued-detail" && buttonId) {
      row1.addComponents(button)
    }
  } else {
    if (select) {
      row1.addComponents(select)
      row2.addComponents(button)
    } else {
      row1.addComponents(button)
    }
  }
  const embed =
    state === "queued-detail"
      ? getSuccessEmbed({
          title,
          description: `Alternatively, you can remove the trackers interactively by running \`${PREFIX}sale remove\``,
        })
      : state === "undo-detail"
      ? getSuccessEmbed({ title, description: "Action cancelled" })
      : composeEmbedMessage(null, {
          color: embedsColors["Marketplace"],
          title,
          description:
            options.length === 0
              ? "No tracker setup"
              : `Sending notifications to channel <#${channelId}>:\n${composeSimpleSelection(
                  options.map(
                    (c: any) =>
                      `\`${shortenHashOrAddress(
                        c.contract_address
                      )}\` - platform id ${c.platform}`
                  )
                )}`,
        })

  return {
    embed,
    components:
      state === "queued" && options.length > 0 ? [row1, row2] : [row1],
  }
}

export async function handleSalesRemove(
  msg: Message | CommandInteraction,
  guildId: string,
  addressArg: string,
  authorId: string
) {
  const res = await community.getSalesTrackers(guildId)
  if (!res.ok) {
    throw new APIError({ message: msg, curl: res.curl, description: res.log })
  }
  if (!res.data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No tracker set",
            description:
              "You currently have no trackers set, start tracking with `sales track`",
          }),
        ],
      },
    }
  }
  const { isAddress, value } = parseDiscordToken(addressArg)
  let replyMsg: Message
  if (isAddress && value) {
    const timeoutId = remove(guildId, value, () => {
      replyMsg?.edit({ components: [] }).catch(() => null)
    })

    const { embed, components } = renderResponse(
      "queued-detail",
      "Tracker removed",
      res.data.collection.filter((c: any) => c.contract_address !== value),
      res.data.channel_id,
      timeoutId
    )
    replyMsg = (await msg.reply({
      embeds: [embed],
      components,
    })) as Message
    if (!replyMsg) {
      throw new InternalError({})
    }
  } else {
    const { embed, components } = renderResponse(
      "idle",
      "Choose 1 from the list",
      res.data.collection,
      res.data.channel_id
    )
    replyMsg = (await msg.reply({
      embeds: [embed],
      components,
    })) as Message
  }

  buttonCollector = collectButton(replyMsg, authorId)
  collectSelect(replyMsg, authorId)
  return null
}

const command: Command = {
  id: "track_sales",
  command: "remove",
  brief: "Remove a sales tracker from an NFT collection",
  category: "Community",
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const args = getCommandArguments(msg)
    return await handleSalesRemove(
      msg,
      msg.guildId,
      args[2] ?? "",
      msg.author.id
    )
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `// Interactively\n${PREFIX}sales remove\n\n// If you already know what to remove\n${PREFIX}sales remove <contract-address>`,
        examples: `${PREFIX}sales remove\n${PREFIX}sales remove 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73`,
        document: `${SALE_TRACKER_GITBOOK}&action=remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Marketplace",
}

export default command
