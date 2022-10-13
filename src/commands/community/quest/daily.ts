import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { GuildIdNotFoundError } from "errors"
import type { Command } from "types/common"
import { buildProgressBar, emojis, getEmoji, getEmojiURL } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

const emoji = {
  leftFilled: getEmoji("imperial_exp_1", true),
  filled: getEmoji("imperial_exp_2", true),
  rightFilled: getEmoji("imperial_exp_3", true),
  leftEmpty: getEmoji("faction_exp_1"),
  empty: getEmoji("faction_exp_2"),
  rightEmpty: getEmoji("faction_exp_3"),
}

const sample = buildProgressBar({ total: 5, progress: 2, emoji })

const getClaimButton = (disabled = false) => {
  return {
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setDisabled(disabled)
          .setStyle("SECONDARY")
          .setEmoji(getEmoji("approve"))
          .setCustomId("claim-rewards-daily")
          .setLabel(disabled ? "No rewards to claim" : "Claim rewards")
      ),
    ],
  }
}

export async function handleBackToQuestList(i: ButtonInteraction) {
  await i.deferUpdate().catch(() => null)
  const msg = await (i.message as Message).fetchReference().catch(() => null)

  const {
    messageOptions: { embeds },
  } = await run(msg)

  i.editReply({
    embeds,
    ...getClaimButton(true),
  })
}

export async function handleClaimReward(i: ButtonInteraction) {
  await i.deferUpdate().catch(() => null)
  const msg = await (i.message as Message).fetchReference().catch(() => null)
  const embed = composeEmbedMessage(msg, {
    title: "Rewards Claimed!",
    description: "Congrats! The following rewards have been sent to you:",
    footer: ["Daily quests reset at 00:00 UTC"],
  })

  i.editReply({
    embeds: [embed],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("back-to-quest-list")
          .setEmoji(getEmoji("left_arrow"))
          .setStyle("SECONDARY")
          .setLabel("Back to quest list")
      ),
    ],
  })
}

export async function run(msg: Message | null) {
  const embed = composeEmbedMessage(msg, {
    title: "Daily Quests",
    description: `${[
      `**Quests will refresh in \`x\`h \`y\`m**`,
      "Completing all quests will reward you with a bonus!",
      "Additionally, a high `$vote` streak can also increase your reward",
    ].join("\n")}\n\n**Completion Progress**`,
    thumbnail: getEmojiURL(emojis.CHEST),
    footer: ["Daily quests reset at 00:00 UTC"],
  })

  embed.fields = [
    {
      name: "Say GM",
      value: `${sample} \`${2}/${5}\`\n**Rewards:** something`,
    },
    {
      name: "Vote for Mochi",
      value: `${sample} \`${2}/${5}\`\n**Rewards:** something`,
    },
    {
      name: "Vote for Mochi",
      value: `${sample} \`${2}/${5}\`\n**Rewards:** something`,
    },
    {
      name: "Check price",
      value: `${sample} \`${2}/${5}\`\n**Rewards:** something`,
    },
    {
      name: "Check your watchlist",
      value: `${sample} \`${2}/${5}\`\n**Rewards:** something`,
    },
    {
      name: "Login to verse",
      value: `${sample} \`${2}/${5}\`\n**Rewards:** something`,
    },
  ].map((f) => ({ ...f, name: `**${f.name}**`, inline: false }))

  return {
    messageOptions: {
      embeds: [embed],
      ...getClaimButton(),
    },
  }
}

const command: Command = {
  id: "quest_daily",
  command: "daily",
  brief: "Your daily quests, resets at 00:00 UTC",
  category: "Community",
  run: async function (msg) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    return run(msg)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}quest daily`,
          examples: `${PREFIX}quest daily`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
