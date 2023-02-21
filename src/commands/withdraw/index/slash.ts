import defi from "adapters/defi"
import { CommandInteraction } from "discord.js"
import { composeButtonLink } from "ui/discord/button"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmojiURL } from "utils/common"
import * as processor from "./processor"

const run = async (interaction: CommandInteraction) => {
  const amount = interaction.options.getNumber("amount", true)
  const token = interaction.options.getString("token", true).toUpperCase()
  // check balance
  const invalidBalEmbed = await defi.getInsuffientBalanceEmbed(
    interaction,
    interaction.user.id,
    token,
    Number(amount),
    false
  )
  if (invalidBalEmbed) {
    return {
      messageOptions: {
        embeds: [invalidBalEmbed],
      },
    }
  }
  const dm = await interaction.user.send({
    embeds: [
      composeEmbedMessage(null, {
        author: ["Withdraw message", getEmojiURL(emojis.WALLET)],
        description: `Please enter your **${token}** destination address that you want to withdraw your tokens below.`,
      }),
    ],
  })

  if (interaction.guildId !== null) {
    interaction.followUp({
      embeds: [
        composeEmbedMessage(null, {
          author: ["Withdraw tokens", getEmojiURL(emojis.WALLET)],
          description: `${interaction.user}, a withdrawal message has been sent to you. Check your DM!`,
        }),
      ],
      components: [composeButtonLink("See the DM", dm.url)],
    })
  }
  const addr = await processor.getDestinationAddress(interaction, dm, token)
  return await processor.withdrawSlash(
    interaction,
    amount.toString(),
    token,
    addr
  )
}
export default run
