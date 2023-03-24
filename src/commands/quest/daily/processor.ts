import community from "adapters/community"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { APIError } from "errors"
import {
  buildProgressBar,
  emojis,
  getEmoji,
  getEmojiURL,
  msgColors,
} from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
dayjs.extend(utc)

const emoji = {
  leftFilled: getEmoji("imperial_exp_1", true),
  filled: getEmoji("imperial_exp_2", true),
  rightFilled: getEmoji("imperial_exp_3", true),
  leftEmpty: getEmoji("faction_exp_1"),
  empty: getEmoji("faction_exp_2"),
  rightEmpty: getEmoji("faction_exp_3"),
}

const getClaimButton = (disabled = false, authorId: string) => {
  return {
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setDisabled(disabled)
          .setStyle("SECONDARY")
          .setEmoji(getEmoji("approve"))
          .setCustomId(`claim-rewards-daily_${authorId}`)
          .setLabel(disabled ? "No rewards to claim" : "Claim rewards")
      ),
    ],
  }
}

export async function handleBackToQuestList(i: ButtonInteraction) {
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
    ...getClaimButton(true, authorId),
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
        .map((e: any) => `${getEmoji("blank")}${getEmoji("reply")} ${e}`)
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
          .setEmoji(getEmoji("left_arrow"))
          .setStyle("SECONDARY")
          .setLabel("Back to quest list")
      ),
    ],
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

  const nowUtc = dayjs().utc()
  const resetUtc = dayjs().endOf("day").utc(true)

  const hour = resetUtc.diff(nowUtc, "hour")
  const minute = Math.round(resetUtc.diff(nowUtc, "minute") % 60)

  const embed = composeEmbedMessage(msg, {
    title: "Daily Quests",
    description: `${[
      `**Quests will refresh in \`${hour}\`h \`${minute}\`m**`,
      "Completing all quests will reward you with a bonus!",
      "Additionally, a high `$vote` streak can also increase your reward",
    ].join("\n")}\n\n**Completion Progress**`,
    thumbnail: getEmojiURL(emojis.CHEST),
    footer: ["Daily quests reset at 00:00 UTC"],
    color: msgColors.YELLOW,
  })

  embed.fields = res.data
    .filter(
      (d: any) =>
        d.action !== "bonus" && d.action !== "trade" && d.action !== "vote"
    )
    .map((d: any) => {
      const rewards = d.quest.rewards
        .map(
          (r: any) =>
            `${getEmoji(
              r.reward_type.name.toLowerCase() == "xp"
                ? "xp2"
                : r.reward_type.name
            )} \`${r.reward_amount}\` ${r.reward_type.name}`
        )
        .join(" and ")
      return {
        name: `**${d.quest.title}**`,
        value: `${getEmoji(
          d.is_completed ? "approve" : "approve_grey"
        )} ${buildProgressBar({
          emoji,
          total: d.target,
          progress: d.current,
        })} \`${d.current}/${d.target}\`\n**Rewards:** ${rewards}`,
        inline: false,
      }
    })

  const claimable = res.data.some((d: any) => d.is_completed && !d.is_claimed)

  return {
    messageOptions: {
      embeds: [embed],
      ...getClaimButton(!claimable, userId),
    },
  }
}
