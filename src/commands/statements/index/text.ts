import { Message } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { buildButtonsRow, handleStatement, listenButtonsRow } from "./processor"
import { getEmoji, msgColors } from "utils/common"
import { PREFIX } from "utils/constants"
import { getCommandArguments } from "utils/commands"
import { isTokenSupported } from "utils/tip-bot"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  const token = args.length > 1 ? args[1] : ""
  const tokenValid = await isTokenSupported(token)
  if (args.length > 1 && !tokenValid) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Unsupported token",
            description: `**${token.toUpperCase()}** hasn't been supported.\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )}.`,
          }),
        ],
      },
    }
  }
  const pages = await handleStatement(token, msg.author.id)
  if (pages.length === 0) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: `${getEmoji("STATEMENTS")} No transaction history`,
            description: `You haven't made any transaction ${
              token !== "" ? `with **${token.toUpperCase()}** yet` : ""
            }. You can try \`${PREFIX}tip <@username/@role> <amount> <token>\` to transfer ${
              token !== "" ? `**${token.toUpperCase()}**` : "token"
            } to other users.`,
            color: msgColors.SUCCESS,
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
  const reply = await msg.reply(msgOpts.messageOptions)
  listenButtonsRow(
    reply,
    msg,
    args[1],
    pages,
    async (_msg: Message, idx: number, pages: any) => {
      return {
        messageOptions: {
          embeds: [pages[idx]],
          components: buildButtonsRow(idx, pages.length),
        },
      }
    }
  )
}
export default run
