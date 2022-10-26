import { ChannelType, ThreadAutoArchiveDuration } from "discord-api-types/v9"
import {
  ButtonInteraction,
  DiscordAPIError,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageOptions,
  TextChannel,
  ThreadChannel,
} from "discord.js"
import { APIError, CommandError } from "errors"
import { Command } from "types/common"
import { getInventory, newCaptcha, renderTrade, session } from "./utils"
import { composeEmbedMessage, getExitButton } from "utils/discordEmbed"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  shortenHashOrAddress,
} from "utils/common"
import ConversationManager, { Handler } from "utils/ConversationManager"
import profile from "adapters/profile"
import community from "adapters/community"

type Item = {
  address: string
  token_ids: Array<string>
}

// message id -> trade request
const requestMap = new Map<
  string,
  { address: string; have_items: Array<Item>; want_items: Array<Item> }
>()

type BeginSessionParams = {
  channel: TextChannel
  userAid: string
  userBid: string
  threadName: string
  msgOpts: MessageOptions
}

async function handleBeginSession(params: BeginSessionParams) {
  const { channel, userAid, userBid, msgOpts, threadName } = params

  const userData = session.get(userAid)
  if (!userData) return
  const { userA } = userData

  let thread: ThreadChannel
  try {
    // try to create a private thread
    thread = await channel.threads.create({
      name: threadName,
      type: ChannelType.GuildPrivateThread,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
    })
  } catch (e: any) {
    if (e instanceof DiscordAPIError) {
      // nitro level too low -> create public thread
      if (e.code === 20035) {
        thread = await channel.threads.create({
          name: threadName,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
        })
      } else {
        return false
      }
    } else {
      return false
    }
  }

  const user = channel.members.get(userAid)
  if (user) {
    await thread.send(msgOpts)

    await thread.members.add(userA.id)
    await thread.members.add(userBid)

    await thread.send(
      `> @here\n**IMPORTANT NOTES**:\n${[
        "Check the address of your trader, make sure it is the correct one",
        "Check the swap items' address, token id (is it the right collection/chain/item?)",
        "Be friendly and kind to each other",
        "Once all the correct items have been deposited, the swap will happen automatically, this action cannot be **__undone__**",
      ]
        .map((r, i) => `> **${i + 1}**. ${r}.`)
        .join("\n")}`
    )
  }
}

export async function handleButtonOffer(i: ButtonInteraction) {
  await i.deferReply({ ephemeral: true })
  const [, userAid, requestId] = i.customId.split("_")
  if (i.user.id === userAid) {
    i.editReply({
      content: "You can't swap with yourself!",
    })
  } else {
    const msg = i.message as Message
    if (msg.channel.type === "GUILD_TEXT") {
      await i.editReply({
        content: "> Creating a thread...",
      })
      const channel = msg.channel
      const embed = i.message.embeds[0]

      embed.description =
        "Thread created for extra discussion, otherwise follow the link to complete your swap"

      await handleBeginSession({
        channel,
        userAid,
        userBid: i.user.id,
        threadName: i.user.tag,
        msgOpts: {
          embeds: [embed],
          components: [
            new MessageActionRow().addComponents(
              new MessageButton()
                .setLabel("Swap link")
                .setStyle("LINK")
                .setURL(
                  `https://mochi-web-git-feat-trade-podso.vercel.app/trade/${requestId}`
                )
            ),
          ],
        },
      })
      i.editReply({
        content: "> Thread created",
      })
      session.get(userAid)?.tradeRequests.delete(requestId)
    }
  }
}

export async function handleCreateSwap(i: ButtonInteraction) {
  i.deferUpdate()
  const userProfileRes = await profile.getUserProfile(
    i.guildId ?? "",
    i.user.id
  )
  let wallet = userProfileRes.data?.user_wallet?.address
  wallet = "0x6497b5580A58f2B890B3AD66bC459341312AcC23"

  if (!wallet) {
    i.editReply({
      embeds: [
        composeEmbedMessage(null, {
          title: "Only for verified users",
          description:
            "This feature requires you being verified a.k.a have a wallet address, please verify first",
        }),
      ],
    })
    return
  }

  requestMap.set(i.message.id, {
    address: wallet,
    have_items: [],
    want_items: [],
  })

  const inventory = await getInventory(wallet)

  const embed = composeEmbedMessage(null, {
    title: "What items do you have?",
    description:
      "Select your NFT then input your token id, when you're done, click Next",
    thumbnail:
      "https://cdn.discordapp.com/attachments/1010131326256558110/1034414418303397928/give.png",
  })

  const items = Object.entries(inventory).sort((a, b) =>
    a[1].collectionName > b[1].collectionName
      ? 1
      : a[1].collectionName < b[1].collectionName
      ? -1
      : 0
  )

  embed.setFields(
    items.map((c, i) => {
      return {
        name: `${c[1].collectionName} (${c[1].tokens.length} items)`,
        value:
          i === 0
            ? `[\`${shortenHashOrAddress(
                c[1].collectionAddress
              )}\`](https://getmochi.co)`
            : `\`${shortenHashOrAddress(c[1].collectionAddress)}\``,
        inline: false,
      }
    })
  )

  i.editReply({
    embeds: [embed],
    components: [
      new MessageActionRow().addComponents(
        getExitButton(i.user.id),
        new MessageButton()
          .setEmoji("🔽")
          .setStyle("SECONDARY")
          .setCustomId("down")
          .setLabel("Down"),
        new MessageButton()
          .setEmoji("🔼")
          .setStyle("SECONDARY")
          .setCustomId("up")
          .setLabel("Up"),
        new MessageButton()
          .setEmoji(emojis.RIGHT_ARROW)
          .setStyle("SECONDARY")
          .setCustomId("want-items")
          .setLabel("Next")
      ),
    ],
  })
  ConversationManager.startConversation(i.user.id, i.channelId, {
    handler: createSwap({
      step: 1,
      address: wallet,
      list: items,
    }),
    msg: i.message as Message,
  })
}

function createSwap({
  step,
  address,
  captcha = "",
  selectIndex = 0,
  list = [],
}: {
  step: number
  address: string
  captcha?: string
  selectIndex?: number
  list?: Array<any>
}): Handler {
  return <Handler>async function (msgOrInteraction, originalMessage) {
    if (msgOrInteraction instanceof ButtonInteraction) {
      if (!msgOrInteraction.deferred) {
        msgOrInteraction.deferUpdate()
      }
      const btn = msgOrInteraction
      switch (btn.customId) {
        case "up": {
          const embed = originalMessage.embeds[0]
          let newIndex = selectIndex - 1
          if (newIndex < 0) {
            newIndex = list.length - 1
          }

          embed.fields = embed.fields.map((f, i) => {
            const selectedItems = `\n${list[i][1].tokens
              .filter((t: any) => t.isSelected)
              .map(
                (t: any) =>
                  `${getEmoji("blank")}${getEmoji("reply")}Token ID ${
                    t.token_id
                  }`
              )
              .join("\n")}`

            return {
              ...f,
              value:
                i === newIndex
                  ? `[\`${shortenHashOrAddress(
                      list[i][0]
                    )}\`](https://getmochi.co)${selectedItems}`
                  : `\`${shortenHashOrAddress(list[i][0])}\`${selectedItems}`,
            }
          })

          return {
            end: false,
            editOptions: {
              embeds: [embed],
            },
            nextHandler: createSwap({
              step: 1,
              address,
              selectIndex: newIndex,
              list,
            }),
          }
        }
        case "down": {
          const embed = originalMessage.embeds[0]
          let newIndex = selectIndex + 1
          if (newIndex > list.length - 1) {
            newIndex = 0
          }

          embed.fields = embed.fields.map((f, i) => {
            const selectedItems = `\n${list[i][1].tokens
              .filter((t: any) => t.isSelected)
              .map(
                (t: any) =>
                  `${getEmoji("blank")}${getEmoji("reply")}Token ID ${
                    t.token_id
                  }`
              )
              .join("\n")}`

            return {
              ...f,
              value:
                i === newIndex
                  ? `[\`${shortenHashOrAddress(
                      list[i][0]
                    )}\`](https://getmochi.co)${selectedItems}`
                  : `\`${shortenHashOrAddress(list[i][0])}\`${selectedItems}`,
            }
          })

          return {
            end: false,
            editOptions: {
              embeds: [embed],
            },
            nextHandler: createSwap({
              step: 1,
              address,
              selectIndex: newIndex,
              list,
            }),
          }
        }
        case "want-items": {
          const embed = originalMessage.embeds[0]

          embed.title = "What items do you want?"
          embed.description = "Paste your link"
          embed.thumbnail = {
            url: "https://cdn.discordapp.com/attachments/1010131326256558110/1034414418668298320/receive.png",
          }
          embed.fields = []
          const components = originalMessage.components
          components[0].components[1].customId = "captcha"

          return {
            end: false,
            editOptions: {
              embeds: [embed],
              components: [
                new MessageActionRow().addComponents(
                  getExitButton(btn.user.id),
                  new MessageButton()
                    .setEmoji(emojis.RIGHT_ARROW)
                    .setStyle("SECONDARY")
                    .setCustomId("captcha")
                    .setLabel("Next")
                ),
              ],
            },
            nextHandler: createSwap({ step: 2, address }),
          }
        }
        case "captcha": {
          const captcha = newCaptcha()

          const embed = originalMessage.embeds[0]

          embed.title = "Are you a human?"
          embed.description = "Please enter the text you see"
          embed.fields = []
          embed.thumbnail = {
            url: "https://media.discordapp.net/stickers/963348673889189928.webp?size=320",
          }

          const attachment = new MessageAttachment(
            captcha.JPEGStream,
            "captcha.jpeg"
          )
          embed.setImage("attachment://captcha.jpeg")
          const components = originalMessage.components
          components[0].components.pop()

          return {
            end: false,
            editOptions: {
              files: [attachment],
              embeds: [embed],
              components,
            },
            nextHandler: createSwap({
              step: 3,
              address,
              captcha: captcha.value,
            }),
          }
        }
        default:
          return {
            end: true,
            nextHandler: null,
          }
      }
    } else if (msgOrInteraction instanceof Message) {
      const msg = msgOrInteraction
      switch (step) {
        case 1: {
          const content = msg.content
          const request = requestMap.get(originalMessage.id)

          if (request) {
            request.have_items = []
          }

          const newList = list.map((l, i) => {
            if (i !== selectIndex) return l

            const tokens: any = l[1].tokens.map((t: any) => {
              const sameId = t.token_id === content

              return {
                ...t,
                isSelected: sameId ? !t.isSelected : t.isSelected,
              }
            })

            if (request) {
              request.have_items.push({
                address: l[0],
                token_ids: tokens
                  .filter((t: any) => t.isSelected)
                  .map((t: any) => t.token_id),
              })
            }

            return [
              l[0],
              {
                ...l[1],
                tokens,
              },
            ]
          })
          const embed = originalMessage.embeds[0]

          embed.fields = embed.fields.map((f, i) => {
            if (i !== selectIndex) return f

            return {
              ...f,
              value: `[\`${shortenHashOrAddress(
                newList[i][0]
              )}\`](https://getmochi.co)\n${newList[i][1].tokens
                .filter((t: any) => t.isSelected)
                .map(
                  (t: any) =>
                    `${getEmoji("blank")}${getEmoji("reply")}Token ID ${
                      t.token_id
                    }`
                )
                .join("\n")}`,
            }
          })

          return {
            end: false,
            editOptions: {
              embeds: [embed],
            },
            nextHandler: createSwap({
              step: 1,
              address,
              selectIndex,
              list: newList,
            }),
          }
        }
        case 2: {
          const content = msg.content
          const items = content
            .split("\n")
            .map((link) => link.trim().split("/"))
            .reduce((acc: any, c: any) => {
              if (acc[c[0]]) {
                return {
                  ...acc,
                  [c[0]]: [...acc[c[0]], c[1]],
                }
              }
              return {
                ...acc,
                [c[0]]: [c[1]],
              }
            }, {})

          const request = requestMap.get(originalMessage.id)
          request?.want_items.push(
            ...Object.entries<Array<string>>(items).flatMap((e) => {
              return {
                address: e[0],
                token_ids: e[1],
              }
            })
          )

          const embed = originalMessage.embeds[0]

          embed.fields = Object.entries<Array<string>>(items).map((e) => {
            return {
              name: shortenHashOrAddress(e[0]),
              value: e[1]
                .map((t) => {
                  return `${getEmoji("blank")}${getEmoji("reply")}${t}`
                })
                .join("\n"),
              inline: false,
            }
          })

          return {
            end: false,
            editOptions: {
              embeds: [embed],
            },
            nextHandler: createSwap({ step, address }),
          }
        }
        case 3: {
          const content = msg.content
          const canProceed = content.trim() === captcha
          const embed = originalMessage.embeds[0]
          let editOptions
          if (canProceed) {
            const userA = msg.author

            const userData = session.get(userA.id)
            const internalReq = requestMap.get(originalMessage.id)
            if (internalReq) {
              const offer = await community.createTradeOffer({
                owner_address: internalReq.address,
                have_items: internalReq.have_items.map((i) => ({
                  token_address: i.address,
                  token_ids: i.token_ids,
                })),
                want_items: internalReq.want_items.map((i) => ({
                  token_address: i.address,
                  token_ids: i.token_ids,
                })),
              })
              if (!offer.ok || !offer.data.id) {
                throw new APIError({ curl: offer.curl, description: offer.log })
              }

              if (!userData) {
                session.set(userA.id, {
                  userA: {
                    id: userA.id,
                    tag: userA.tag,
                    address,
                  },
                  tradeRequests: new Map([[offer.data.id, internalReq]]),
                })
              } else {
                userData.tradeRequests.set(offer.data.id, internalReq)
              }
              editOptions = {
                files: [],
                ...renderTrade({
                  user: msg.author,
                  requestId: offer.data.id,
                  request: internalReq,
                }),
              }

              requestMap.delete(originalMessage.id)
            }
          } else {
            embed.description = "Sorry, please try again!"
            const c = newCaptcha()
            captcha = c.value

            const attachment = new MessageAttachment(
              c.JPEGStream,
              "captcha.jpeg"
            )
            embed.setImage("attachment://captcha.jpeg")

            editOptions = {
              files: [attachment],
              embeds: [embed],
            }
          }

          return {
            end: canProceed,
            editOptions,
            nextHandler: canProceed
              ? null
              : createSwap({ step: 3, address, captcha }),
          }
        }
        default:
          return {
            end: true,
            nextHandler: null,
          }
      }
    }
  }
}

const command: Command = {
  id: "swap",
  brief: "Swap NFTs with other user",
  command: "swap",
  run: async (msg: Message) => {
    if (msg.channel.isThread()) {
      throw new CommandError({
        message: msg,
        description: "Swap request must be in a text channel",
      })
    }

    const embed = composeEmbedMessage(msg, {
      title: "Create Swap Request",
      color: "#379c6f",
      thumbnail: getEmojiURL(emojis["TRADE"]),
      description: `${msg.author}, do you want to create a swap request?`,
    }).setTimestamp()

    return {
      messageOptions: {
        embeds: [embed],
        components: [
          new MessageActionRow().addComponents(
            getExitButton(msg.author.id),
            new MessageButton()
              .setStyle("SECONDARY")
              .setLabel("Yes")
              .setCustomId("create-trade")
              .setEmoji(emojis.APPROVE)
          ),
        ],
      },
    }
  },
  colorType: "Defi",
  getHelpMessage: async () => {
    return { content: "" }
  },
  canRunWithoutAction: true,
  category: "Community",
  experimental: true,
}

export default command
