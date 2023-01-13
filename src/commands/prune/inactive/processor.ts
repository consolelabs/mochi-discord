import { ButtonInteraction } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { getEmoji } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"

export const CONFIRM_PRUNE_INACTIVE = "confirm_prune_inactive"

export async function pruneInactiveExecute(i: ButtonInteraction, days: number) {
  if (i.customId !== CONFIRM_PRUNE_INACTIVE) {
    return
  }
  if (!i.guild) throw new GuildIdNotFoundError({})

  const pruned = await i.guild.members.prune({
    days: days,
    reason: `Inactive User`,
  })

  await i.reply({
    ephemeral: true,
    embeds: [
      composeEmbedMessage(null, {
        title: `${getEmoji("APPROVE")} Successfully pruned`,
        description: `You have pruned ${pruned} members`,
      }),
    ],
  })
}
