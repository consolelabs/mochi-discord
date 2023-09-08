import { embedsColors, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SlashCommandBuilder } from "@discordjs/builders"
import {
  ColorResolvable,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import { getProfileIdByDiscord } from "utils/profile"
import profile from "adapters/profile"
import { InternalError } from "errors"
import { HOMEPAGE_URL } from "utils/constants"

const slashCmd: SlashCommand = {
  name: "telegram",
  category: "Profile",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("telegram")
      .setDescription("Connect Telegram account with Discord")

    return data
  },
  run: async function (interaction) {
    if (!interaction.member || !interaction.guildId) return
    const embed = new MessageEmbed()
      .setColor(embedsColors.Profile as ColorResolvable)
      .setTitle("Link your Telegram account")
      .setDescription(
        `Please connect your Telegram by clicking the button below.`,
      )
    // request profile code
    const profileId = await getProfileIdByDiscord(interaction.user.id)
    const { data, ok, error } = await profile.requestProfileCode(profileId)
    if (!ok) {
      throw new InternalError({
        description: error,
        msgOrInteraction: interaction,
      })
    }
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel("Connect")
        .setStyle("LINK")
        .setURL(`${HOMEPAGE_URL}/connect-telegram?code=${data.code}`),
    )
    await interaction
      .editReply({ embeds: [embed], components: [row] })
      .catch(() => null)
  },
  help: () =>
    Promise.resolve({
      embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
    }),
  colorType: "Defi",
  ephemeral: true,
}

export default { slashCmd }
