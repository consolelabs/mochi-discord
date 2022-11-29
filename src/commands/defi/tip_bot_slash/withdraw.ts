import { SlashCommand } from "types/common"
import {
  SLASH_PREFIX,
  DEFI_DEFAULT_FOOTER,
  DEPOSIT_GITBOOK,
} from "utils/constants"
import { composeButtonLink, composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { emojis, getEmojiURL, thumbnails } from "utils/common"
import Defi from "adapters/defi"
import { APIError } from "errors"
import { composeWithdrawEmbed, getDestinationAddress } from "../withdraw"

async function withdrawSlash(i: CommandInteraction, amount: string, token: string, addr: string){
    const payload = await Defi.getWithdrawPayload(i, amount, token, addr)
    payload.fullCommand = `${i.commandName} ${amount} ${token}`
    const { data, ok, error, log, curl } = await Defi.offchainDiscordWithdraw(
      payload
    )
    if (!ok) {
      throw new APIError({ description: log, curl, error })
    }
    
    const embedMsg = composeWithdrawEmbed(payload, data)
  
    await i.user.send({ embeds: [embedMsg] })
}

const command: SlashCommand = {
  name: "withdraw",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("withdraw")
      .setDescription("Withdraw tokens to your wallet outside of Discord.")
      .addStringOption((option) =>
        option
          .setName("amount")
          .setDescription("specific amount you want to withdraw or all. Example: 1, all")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("symbol of token. Example: ftm")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const amount = interaction.options.getString("amount")
    const token = interaction.options.getString("token")
    if (!amount || !token ){
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

    const dm = await interaction.user.send({
        embeds: [
          composeEmbedMessage(null, {
            author: ["Withdraw message", getEmojiURL(emojis.WALLET)],
            description: `Please enter your **${token.toUpperCase()}** destination address that you want to withdraw your tokens below.`,
          }),
        ],
    })
  
    if (interaction.guild !== null) {
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
    const addr = await getDestinationAddress(interaction, dm)
    return await withdrawSlash(interaction, amount, token, addr)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TOKENS,
        usage: `${SLASH_PREFIX}withdraw <amount> <token>`,
        description: "Withdraw tokens to your wallet outside of Discord. A network fee will be added on top of your withdrawal (or deducted if remaining balance is insufficient).\nYou will be asked to confirm it.",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${SLASH_PREFIX}wd 5 ftm\n${SLASH_PREFIX}withdraw 5 ftm`,
        document: DEPOSIT_GITBOOK,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
