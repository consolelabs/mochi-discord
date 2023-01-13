import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "discord/embed/ui"
import {
  getComponentsNormalState,
  handleFeedback,
  inviteUserToJoin,
} from "./processor"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  if (args.length == 1) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            usage: `${PREFIX}feedback <${PREFIX}command> <description>`,
            examples: `${PREFIX}feedback i like it\n${PREFIX}feedback $gm UI can be better`,
            footer: [`Type ${PREFIX}help for more actions!`],
            description:
              "Give feedback for the Mochi team about a specific command or in general",
          }),
        ],
      },
    }
  }
  let commandArg = args[1]
  let feedback = ""
  if (commandArg[0] == "$") commandArg = commandArg.slice(1).toUpperCase()
  else commandArg = ""

  if (commandArg === "") feedback = args.slice(1).join(" ")
  else feedback = args.slice(2).join(" ")

  if (!feedback) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "Feedback failed.",
            description: `Looks like your feedback is empty.`,
            originalMsgAuthor: msg.author,
          }),
        ],
      },
    }
  }

  const avatar = msg.author.avatarURL() ?? ""

  return {
    messageOptions: {
      embeds: [
        await handleFeedback({
          discord_id: msg.author.id,
          username: msg.author.username,
          avatar,
          command: commandArg,
          feedback,
          message_id: `${msg.channelId}/${msg.id}`,
        }),
        inviteUserToJoin(),
      ],
      components: [getComponentsNormalState(msg.author.id, true)],
    },
  }
}
export default run
