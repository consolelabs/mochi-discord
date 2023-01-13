import profile from "adapters/profile"
import {
  ButtonInteraction,
  ColorResolvable,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import { WEBSITE_ENDPOINT } from "env"
import { embedsColors } from "types/common"

export async function sendVerifyURL(interaction: ButtonInteraction) {
  if (!interaction.member || !interaction.guild) return
  await interaction.deferReply({ ephemeral: true })
  const json = await profile.generateVerificationCode(
    interaction.member.user.id,
    interaction.guild.id
  )
  switch (json.error) {
    case "already have a verified wallet": {
      const reverify = await profile.generateVerificationCode(
        interaction.member.user.id,
        interaction.guild.id,
        true
      )
      const e1 = new MessageEmbed()
        .setColor(embedsColors.Profile as ColorResolvable)
        .setTitle("You already have verified a wallet address")
        .setDescription(
          `\`\`\`${json.address}\`\`\`\nIf you want to change your address, [click here](${WEBSITE_ENDPOINT}/verify?code=${reverify.code}) to re-verify.`
        )
      await interaction.editReply({ embeds: [e1] }).catch(() => null)
      break
    }
    case undefined: {
      const e2 = new MessageEmbed()
        .setColor(embedsColors.Profile as ColorResolvable)
        .setTitle("Verify your wallet address")
        .setDescription(
          `Please verify your wallet address by clicking the button below.`
        )
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("Verify")
          .setStyle("LINK")
          .setURL(`${WEBSITE_ENDPOINT}/verify?code=${json.code}`)
      )
      await interaction
        .editReply({ embeds: [e2], components: [row] })
        .catch(() => null)
      break
    }
    default:
      throw new Error(json.error)
  }
}
