import {
  ButtonInteraction,
  ColorResolvable,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import { embedsColors } from "types/common"
import { HOMEPAGE_URL } from "utils/constants"
import profile from "../../../adapters/profile"
import { getProfileIdByDiscord } from "../../../utils/profile"
import { APIError } from "../../../errors"

export async function sendVerifyURL(interaction: ButtonInteraction) {
  if (!interaction.member || !interaction.guildId) return
  await interaction.deferReply({ ephemeral: true })
  const embed = new MessageEmbed()
    .setColor(embedsColors.Profile as ColorResolvable)
    .setTitle("Verify your wallet address")
    .setDescription(
      `Please verify your wallet address by clicking the button below.`,
    )
  // request profile code
  const profileId = await getProfileIdByDiscord(interaction.user.id)
  const {
    data,
    ok,
    curl,
    log,
    status = 500,
    error,
  } = await profile.requestProfileCode(profileId)
  if (!ok) {
    throw new APIError({
      curl,
      description: log,
      msgOrInteraction: interaction,
      status,
      error,
    })
  }
  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("Verify")
      .setStyle("LINK")
      .setURL(
        `${HOMEPAGE_URL}/verify?code=${data.code}&guild_id=${interaction.guildId}`,
      ),
  )
  await interaction
    .editReply({ embeds: [embed], components: [row] })
    .catch(() => null)
}
