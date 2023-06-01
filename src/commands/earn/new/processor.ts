import community from "adapters/community"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  User,
} from "discord.js"
import { APIError } from "errors"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  msgColors,
  EmojiKey,
  authorFilter,
} from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { wrapError } from "utils/wrap-error"
dayjs.extend(utc)

const DATA = [
  {
    id: 1,
    title: "1 slot WL PEKACHU INU",
    deadline: "22-06-2023",
  },
  {
    id: 2,
    title: "Airdrop - Tabi (Part 02) - Chain BSC",
    deadline: "22-06-2023",
  },
  {
    id: 3,
    title: "Update - Airdrop - Libra Incentix - Chain BSC",
    deadline: "22-06-2023",
  },
  {
    id: 4,
    title: "Update - Airdrop - Fantasize - Chain ETH",
    deadline: "22-06-2023",
  },
  {
    id: 5,
    title: "Airdrop - Position Exchange - Chain BSC",
    deadline: "22-06-2023",
  },
]

const getFooterButtons = (disabled = false, authorId: string) => {
  return {
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setDisabled(disabled)
          .setStyle("PRIMARY")
          .setEmoji(getEmoji("PREV_PAGE"))
          .setCustomId(`prev_new_earn_${authorId}`),
        new MessageButton()
          .setDisabled(disabled)
          .setStyle("PRIMARY")
          .setEmoji(getEmoji("NEXT_PAGE"))
          .setCustomId(`next_new_earn_${authorId}`)
      ),
      new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setPlaceholder(`Go to airdrop detail`)
          .setCustomId(`earn_detail_${authorId}`)
          .addOptions(
            DATA.map((data, i) => ({
              emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
              label: data.title,
              value: data.id.toString(),
            }))
          )
      ),
    ],
  }
}

const getDetailButtons = (disabled = false, authorId: string) => {
  return {
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setDisabled(disabled)
          .setStyle("SECONDARY")
          .setLabel("Back to list")
          .setEmoji(getEmoji("LEFT_ARROW"))
          .setCustomId(`back_new_earn_${authorId}`),
        new MessageButton()
          .setDisabled(disabled)
          .setStyle("SECONDARY")
          .setLabel("Done")
          .setEmoji(getEmoji("CHECK"))
          .setCustomId(`done_earn_${authorId}`),
        new MessageButton()
          .setDisabled(disabled)
          .setStyle("SECONDARY")
          .setLabel("Skip")
          .setEmoji(getEmoji("NEXT_PAGE"))
          .setCustomId(`skip_earn_${authorId}`),
        new MessageButton()
          .setDisabled(disabled)
          .setStyle("SECONDARY")
          .setLabel("Favorite")
          .setEmoji(getEmoji("ANIMATED_STAR"))
          .setCustomId(`fav_earn_${authorId}`)
      ),
    ],
  }
}

export async function handleBackToEarnList(i: ButtonInteraction) {
  await i.deferUpdate().catch(() => null)
  const authorId = i.customId.split("_")[1]
  if (authorId !== i.user.id) return

  const msg = await (i.message as Message)
    .fetchReference()
    .catch(() => undefined)
  const {
    messageOptions: { embeds },
  } = await run(i.user.id, msg)

  i.editReply({
    embeds,
    ...getFooterButtons(true, authorId),
  })
}

export async function handleClaimReward(i: ButtonInteraction) {
  await i.deferUpdate().catch(() => null)
  const authorId = i.customId.split("_")[1]
  if (authorId !== i.user.id) return

  const res = await community.claimAllReward(i.user.id)
  if (!res.ok) {
    throw new APIError({ curl: res.curl, description: res.log })
  }
  if (!res.data) return

  const msg = await (i.message as Message).fetchReference().catch(() => null)
  const embed = composeEmbedMessage(msg, {
    title: "Rewards Claimed!",
    description:
      "Congrats! Rewards sent to you, here's the summary of what you just received:",
    footer: ["Daily quests reset at 00:00 UTC"],
    color: msgColors.YELLOW,
  })
  const data = res.data.rewards?.reduce((acc: any, d: any) => {
    const { reward, reward_amount } = d
    const found = acc[reward.reward_type.id]
    if (found) {
      found.total += Number(reward_amount)
      found.list.push(`\`${reward_amount}\` - ${reward.quest.title}`)
    } else {
      acc[reward.reward_type.id] = {
        reward_type: reward.reward_type.name,
        total: reward_amount,
        list: [`\`${reward_amount}\` - ${reward.quest.title}`],
      }
    }

    return acc
  }, {})

  embed.fields = Object.values(data).map((d: any) => {
    return {
      name: `${getEmoji(d.reward_type, d.reward_type === "xp")} \`${
        d.total
      }\` ${d.reward_type}`,
      value: d.list
        .map((e: any) => `${getEmoji("BLANK")}${getEmoji("REPLY")} ${e}`)
        .join("\n"),
      inline: false,
    }
  })

  i.editReply({
    embeds: [embed],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId(`back-to-quest-list_${authorId}`)
          .setEmoji(getEmoji("LEFT_ARROW"))
          .setStyle("SECONDARY")
          .setLabel("Back to quest list")
      ),
    ],
  })
}

// Handle select menu event
// This logic is added in command handler instead of interactionCreate
export async function collectSelection(reply: Message, author: User) {
  // reply = message reply user ngay sau khi user run command
  reply
    .createMessageComponentCollector({
      // chi listen interaction cua select menu
      componentType: "SELECT_MENU",
      // khong chay callback neu nhu nguoi select khong phai la user (e.g vincent run command -> minhth select -> do nothing)
      filter: authorFilter(author.id),
      // thoi gian de listen event select, 5 phut
      time: 300000,
    })
    // handle khi user select
    .on("collect", (i) => {
      // wrapError la 1 function dac biet de handle khi co error thi no se:
      // 1. edit message hien tai thanh message error ("Something went wrong")
      // 2. log error tren gfn
      // 3. send log message qua kafka
      //
      // binh thuong se khong can goi wrapError nhung vi day la callback nen
      // exception xay ra trong callback se crash system nen phai wrap lai
      wrapError(reply, async () => {
        // api cua discord quy dinh khi co new interaction thi phai response lai trong vong n seconds, thuong la 3~5 seconds
        // neu khong no se hien text la "This interaction failed"
        // nen truoc tien minh se phai gui di 1 response defer
        // giong nhu kieu la keu user doi 1 chut, response sap co roi -> nen moi co dong text nay "Bot is thinking...."
        if (!i.deferred) {
          // deferUpdate === khi nao co response moi se update len lai message cu
          // co 1 version nua la deferReply la khi co response moi se reply lai message cu thay vi edit
          await i.deferUpdate().catch(() => null)
        }

        // const authorId = i.customId.split("_")[1]
        // if (authorId !== i.user.id) return

        const [earnId] = i.values
        const data = DATA.find((d) => d.id.toString() === earnId)
        const description = `
        🎁Reward: Get free claim #NFT Citizenship Pass

        🎖Winner: All users I Deadline: N/A

        🗞News: CoinDesk, Binance Labs,...

        🔹Register #web ➡️ click here

        - Connect Metamask wallet

        - Claim NFT & update soon,...

        -------------------------------------------------------------------------
        ✅️Telegram ✅️Facebook ✅️Twitter ✅️Linktree`

        const embed = composeEmbedMessage(null, {
          title: data?.title || `Can get earn detail id ${earnId}`,
          color: msgColors.PINK,
          description,
        })

        // edit embed
        i.editReply({
          embeds: [embed],
          ...getDetailButtons(false, "1"),
        })
      })
    })
    // sau khi het 5 phut, tu dong remove het "components" (select menus, buttons) khoi embed message
    .on("end", () => {
      wrapError(reply, async () => {
        await reply.edit({ components: [] }).catch(() => null)
      })
    })
}

export async function run(userId: string, msg?: Message) {
  const res = await community.getListQuest(userId)
  if (!res.ok) {
    throw new APIError({
      curl: res.curl,
      msgOrInteraction: msg,
      description: res.log,
    })
  }

  const embed = composeEmbedMessage(msg, {
    title: "New Airdrops",
    description: `${[`**5**/100 new airdrops you can join.`].join("\n")}`,
    thumbnail: getEmojiURL(emojis.CHEST),
    // footer: ["Daily quests reset at 00:00 UTC"],
    color: msgColors.YELLOW,
  })

  embed.fields = DATA.map((d: any, i: number) => {
    return {
      name: `\`#000${i + 1}\` ${d.title}`,
      value: `Deadline: **${d.deadline}**`,
      inline: false,
    }
  })

  return {
    messageOptions: {
      embeds: [embed],
      ...getFooterButtons(false, userId),
    },
  }
}
