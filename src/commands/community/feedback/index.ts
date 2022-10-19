import community from "adapters/community"
import { CommandError } from "errors"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"

export async function handleFeedback(req: {
  discord_id: string
  username: string
  avatar: string
  command: string
  feedback: string
}) {
  const res = await community.sendFeedback(req)
  if (!res.ok) {
    throw new CommandError({
      description: "Failed to send your feedback, please try again later",
    })
  }
  return getSuccessEmbed({
    title: "Feedback successfully sent",
    description:
      "We're so happy to hear from you! Thank you for valuable feedback. :pray:",
  })
}

const command: Command = {
  id: "feedback",
  command: "feedback",
  brief: "Feedback",
  category: "Community",
  run: async (msg) => {
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
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}feedback <${PREFIX}command> <description>`,
        examples: `${PREFIX}feedback i like it\n${PREFIX}feedback $gm UI can be better`,
        footer: [`Type ${PREFIX}help for more actions!`],
        description:
          "Give feedback for the Mochi team about a specific command or in general",
      }),
    ],
  }),
  colorType: "Command",
  canRunWithoutAction: true,
  allowDM: true,
}

export default command
