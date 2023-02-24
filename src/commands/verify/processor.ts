import profile from "adapters/profile"
import {
  ButtonInteraction,
  ColorResolvable,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import { WEBSITE_ENDPOINT } from "env"
import { APIError } from "errors"
import { embedsColors } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"

export async function sendVerifyURL(interaction: ButtonInteraction) {
  if (!interaction.member || !interaction.guildId) return
  await interaction.deferReply({ ephemeral: true })
  const { data, ok, curl, log, status } =
    await profile.generateVerificationCode({
      userDiscordId: interaction.member.user.id,
      guildId: interaction.guildId,
    })
  if (status === 409) {
    const reverifyRes = await profile.generateVerificationCode({
      userDiscordId: interaction.member.user.id,
      guildId: interaction.guildId,
      isReverify: true,
    })
    if (!reverifyRes.ok) {
      throw new APIError({
        message: interaction,
        description: reverifyRes.log,
        curl: reverifyRes.curl,
      })
    }
    const embed = composeEmbedMessage(null, {
      color: embedsColors.Profile,
      title: "You already have verified a wallet address",
      description: `\`\`\`${reverifyRes.data.address}\`\`\`\nIf you want to change your address, [click here](${WEBSITE_ENDPOINT}/verify?code=${reverifyRes.data.code}) to re-verify.`,
    })
    await interaction.editReply({ embeds: [embed] }).catch(() => null)
    return
  }
  if (!ok) {
    throw new APIError({ message: interaction, description: log, curl })
  }
  const embed = new MessageEmbed()
    .setColor(embedsColors.Profile as ColorResolvable)
    .setTitle("Verify your wallet address")
    .setDescription(
      `Please verify your wallet address by clicking the button below.`
    )
  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("Verify")
      .setStyle("LINK")
      .setURL(`${WEBSITE_ENDPOINT}/verify?code=${data.code}`)
  )
  await interaction
    .editReply({ embeds: [embed], components: [row] })
    .catch(() => null)
}

// export async function sendVerifyURL(interaction: ButtonInteraction) {
//   if (!interaction.member || !interaction.guildId) return
//   await interaction.deferReply({ ephemeral: true })
//   const { data, ok, curl, log } = await profile.generateVerificationCode({
//     userDiscordId: interaction.member.user.id,
//     guildId: interaction.guildId,
//   })
//   if (!ok) {
//     throw new APIError({ message: interaction, description: log, curl })
//   }
//   const embed = new MessageEmbed()
//     .setColor(embedsColors.Profile as ColorResolvable)
//     .setTitle("Verify your wallet address")
//     .setDescription(
//       `Please verify your wallet address by clicking the button below.`
//     )
//   const row = new MessageActionRow().addComponents(
//     new MessageButton()
//       .setLabel("Verify")
//       .setStyle("LINK")
//       .setURL(`${WEBSITE_ENDPOINT}/verify?code=${data.code}`)
//   )
//   await interaction
//     .editReply({ embeds: [embed], components: [row] })
//     .catch(() => null)
// }
