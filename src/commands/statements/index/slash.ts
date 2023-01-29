import { CommandInteraction } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import { tipTokenIsSupported } from "utils/tip-bot"
import {
  buildButtonsRow,
  handleStatement,
  listenSlashButtonsRow,
} from "./processor"

const run = async (interaction: CommandInteraction) => {
  let token = interaction.options.getString("token")
  if (token) {
    const tokenValid = await tipTokenIsSupported(token)
    if (!tokenValid) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: "Unsupported token",
              description: `**${token.toUpperCase()}** hasn't been supported.\n👉 Please choose one in our supported \`$token list\` or \`$moniker list\`!\n👉 To add your token, run \`$token add-custom\` or \`$token add\`.`,
            }),
          ],
        },
      }
    }
  } else {
    token = ""
  }

  const pages = await handleStatement(token, interaction.user.id)
  if (pages.length === 0) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: `${getEmoji("STATEMENTS")} No transaction history`,
            description: `You haven't made any transaction ${
              token !== "" ? `with **${token.toUpperCase()}** yet` : ""
            }. You can try \`${SLASH_PREFIX}tip <@username/@role> <amount> <token>\` to transfer ${
              token !== "" ? `**${token.toUpperCase()}**` : "token"
            } to other users.`,
          }),
        ],
      },
    }
  }
  const msgOpts = {
    messageOptions: {
      embeds: [pages[0]],
      components: buildButtonsRow(0, pages.length),
    },
  }
  listenSlashButtonsRow(
    interaction,
    token,
    pages,
    async (interaction: CommandInteraction, idx: number, pages: any) => {
      return {
        messageOptions: {
          embeds: [pages[idx]],
          components: buildButtonsRow(idx, pages.length),
        },
      }
    }
  )
  return msgOpts
}
export default run
