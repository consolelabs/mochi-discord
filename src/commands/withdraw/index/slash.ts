import defi from "adapters/defi"
import { CommandInteraction } from "discord.js"
import { emojis, getEmojiURL } from "utils/common"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import * as processor from "./processor"
import { composeButtonLink } from "ui/discord/button"

const run = async (interaction: CommandInteraction) => {
  const amount = interaction.options.getNumber("amount")
  const token = interaction.options.getString("token")
  if (!amount || !token) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "Missing arguments",
          }),
        ],
      },
    }
  }
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
        description: `Please enter your **${token.toUpperCase()}** destination address that you want to withdraw your tokens below.`,
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
  const addr = await processor.getDestinationAddress(interaction, dm)
  return await processor.withdrawSlash(
    interaction,
    amount.toString(),
    token,
    addr
  )
}
export default run
