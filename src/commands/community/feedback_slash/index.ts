import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import {
  getComponentsNormalState,
  handleFeedback,
  inviteUserToJoin,
} from "../feedback"

const command: SlashCommand = {
  name: "feedback",
  category: "Community",
  onlyAdministrator: false,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("feedback")
      .setDescription("Send feedbacks to the Mochi team")
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("your feedback")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("command")
          .setDescription(
            "a specific command to give feedback. Example: ticker"
          )
          .setRequired(false)
      )
    return data
  },
  run: async function (interaction: CommandInteraction) {
    let commandArg = interaction.options.getString("command") ?? ""
    commandArg = commandArg.toUpperCase().replace(/[^a-zA-Z ]/g, "") //remove all special chars, ex: $nft -> NFT

    const feedback = interaction.options.getString("description")
    if (!feedback) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Feedback required.",
              description: `Looks like your feedback is empty.`,
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    const avatar = interaction.user.avatarURL() ?? ""
    return {
      messageOptions: {
        embeds: [
          await handleFeedback({
            discord_id: interaction.user.id,
            username: interaction.user.username,
            avatar,
            command: commandArg,
            feedback,
          }),
          inviteUserToJoin(),
        ],
        components: [getComponentsNormalState(interaction.user.id, true)],
      },
    }
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}feedback <${SLASH_PREFIX}command> <description>`,
        examples: `${SLASH_PREFIX}feedback i like it\n${SLASH_PREFIX}feedback $gm UI can be better`,
        footer: [`Type ${SLASH_PREFIX}help for more actions!`],
        description:
          "Give feedback for the Mochi team about a specific command or in general",
      }),
    ],
  }),
  colorType: "Command",
}

export default command
