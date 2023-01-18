import config from "adapters/config"
import { ButtonInteraction, Message } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"

export async function confirmGlobalXP(
  interaction: ButtonInteraction,
  msg: Message
) {
  await interaction.deferUpdate()
  const [authorId, currentGlobalXP] = interaction.customId.split("-").slice(1)
  if (authorId !== interaction.user.id || !interaction.guildId) {
    return
  }
  const globalXP = !JSON.parse(currentGlobalXP) // toggle config

  await config.updateGuild({
    guildId: interaction.guildId,
    globalXP: `${globalXP}`,
  })
  await msg
    .edit({
      embeds: [
        composeEmbedMessage(msg, {
          author: [
            `Global XP ${globalXP ? "enabled" : "disabled"}`,
            msg.guild?.iconURL() ?? "",
          ],
          description: `You can check your global XP with \`$profile\``,
        }),
      ],
      components: [],
    })
    .catch(() => null)
}
