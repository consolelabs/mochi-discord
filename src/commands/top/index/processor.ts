import { ButtonInteraction, CommandInteraction } from "discord.js"
import { EmojiKey, emojis, getEmoji, getEmojiURL } from "utils/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import community from "adapters/community"
import { InternalError } from "errors"
import { paginationButtons } from "utils/router"

const topEmojis = {
  0: getEmoji("ANIMATED_BADGE_1", true),
  1: getEmoji("ANIMATED_BADGE_2", true),
  2: getEmoji("ANIMATED_BADGE_3", true),
}

export async function render(
  interaction: CommandInteraction | ButtonInteraction,
  page = 0
) {
  if (!interaction.guildId) {
    throw new InternalError({
      msgOrInteraction: interaction,
      descriptions: ["Couldn't run this command"],
      reason:
        "It needs to run inside a server to render stats specific to that server.",
    })
  }

  const res = await community.getTopXPUsers(
    interaction.guildId,
    interaction.user.id,
    page,
    10
  )
  if (!res.ok || !res.data.leaderboard || !res.data.leaderboard.length)
    throw new InternalError({
      msgOrInteraction: interaction,
      descriptions: ["We coulnd't process this command"],
      reason: res.error || "We're investigating",
    })

  const { author, leaderboard } = res.data
  const member = await interaction.guild?.members.fetch(author.user_id)

  const hasLevelRole = !!author.current_level_role.role_id
  const hasNextLevelRole = !!author.next_level_role.role_id

  const embed = composeEmbedMessage(null, {
    author: ["Top engagement by XP", getEmojiURL(emojis.ANIMATED_TROPHY)],
    description: [
      `:identification_card:\`Name.      \`${member}`,
      `${getEmoji("LEAF")}\`Role.      \`${member?.roles.highest}`,
      `${getEmoji("ANIMATED_STAR", true)}\`Your rank.  #${author.guild_rank}\``,
      `${getEmoji("XP")}\`Current XP. ${author.total_xp}\``,
      `${getEmoji("ANIMATED_GEM", true)}\`Next lvl.   ${author.level + 1}\``,
      ...(hasLevelRole
        ? [
            `${getEmoji("ANIMATED_HEART", true)}\`Lvl role.   \`<@&${
              author.current_level_role.role_id
            }>${
              hasNextLevelRole
                ? ` (next is <@&${author.next_level_role.role_id}>)`
                : ""
            }`,
          ]
        : []),
      getEmoji("LINE").repeat(10),
      formatDataTable(
        leaderboard.map((l: any) => ({
          username: `${l.user.username.slice(0, 10)}${
            l.user.username.length > 10 ? "..." : ""
          }`,
          level: `lvl. ${l.level}`,
          xp: l.total_xp,
        })),
        {
          cols: ["username", "level", "xp"],
          rowAfterFormatter: (f, i) => {
            const isFirstPage = page === 0

            return `${
              isFirstPage
                ? topEmojis[i as keyof typeof topEmojis] ??
                  getEmoji(`num_${i}` as EmojiKey)
                : getEmoji(`num_${i}` as EmojiKey)
            }${f}`
          },
        }
      ).joined,
    ].join("\n"),
    // description: `${ blank } ** Your rank:** #${ author.guild_rank }\n${ blank } ** XP:** ${ author.total_xp }\n\u200B`,
  })

  return {
    msgOpts: {
      embeds: [embed],
      components: paginationButtons(page, res.data.metadata.total),
    },
  }
}
