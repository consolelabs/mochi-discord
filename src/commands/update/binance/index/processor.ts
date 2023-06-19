import {
  CommandInteraction,
  GuildMember,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { InternalError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, getEmojiURL, emojis } from "utils/common"

export async function render(
  interaction: CommandInteraction,
  member: GuildMember
) {
  if (!(member instanceof GuildMember)) {
    throw new InternalError({
      msgOrInteraction: interaction,
      description: "Couldn't get user data",
    })
  }

  return await sendBinanceManualMessage(interaction)
}

export function sendBinanceManualMessage(i: CommandInteraction) {
  if (!i.member || !i.guildId)
    return {
      msgOpts: {},
    }

  const embed = composeEmbedMessage(null, {
    author: ["Connect Binance", getEmojiURL(emojis.BINANCE)],
    description: `To link your Binance account, please follow steps below:\n\n${getEmoji(
      "NUM_1"
    )} Create a new API key with **Read-Only permissions** in the [API Management page](https://www.binance.com/en/my/settings/api-management), \n${getEmoji(
      "NUM_2"
    )} Back to Discord and hit **"Connect"**`,
    image: `https://media.discordapp.net/attachments/1052079279619457095/1116282037389754428/Screenshot_2023-06-08_at_15.25.40.png?width=2332&height=1390`,
  })

  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("Connect")
      .setStyle("SECONDARY")
      .setEmoji(getEmoji("BINANCE"))
      .setCustomId("submit_binance")
  )

  return {
    embeds: [embed],
    components: [row],
  }
}
