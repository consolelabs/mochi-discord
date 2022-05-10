import Profile from "../../adapters/profile"
import {
  ButtonInteraction,
  MessageActionRow,
  MessageEmbed,
  MessageButton,
  ColorResolvable
} from "discord.js"
import { msgColors } from "utils/common"
import { WEBSITE_ENDPOINT } from "../../env"

export async function sendVerifyURL(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true })
  try {
    const json = await Profile.generateVerificationCode(
      interaction.member.user.id,
      interaction.guild.id
    )
    switch (json.error) {
      case "already have a verified wallet": {
        const reverify = await Profile.generateVerificationCode(
          interaction.member.user.id,
          interaction.guild.id,
          true
        )
        const e1 = new MessageEmbed()
          .setColor(msgColors.PRIMARY as ColorResolvable)
          .setTitle("You already have verified a wallet address")
          .setDescription(`\`\`\`${json.address}\`\`\`\nIf you want to change your address, [click here](${WEBSITE_ENDPOINT}/verify?code=${reverify.code}) to re-verify.`)
        await interaction.editReply({ embeds: [e1] })
        break
      }
      case undefined: {
        const e2 = new MessageEmbed()
          .setColor(msgColors.PRIMARY as ColorResolvable)
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
        await interaction.editReply({ embeds: [e2], components: [row] })
        break
      }
      default:
        throw new Error(json.error)
    }
  } catch (e: any) {
    await interaction.editReply("Something wrong")
    throw e
    return
  }
}