import { CommandInteraction } from "discord.js"
import {
  getComponentsNormalState,
  handleFeedback,
  inviteUserToJoin,
} from "./processor"
import { getErrorEmbed } from "discord/embed/ui"

const run = async (interaction: CommandInteraction) => {
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
}
export default run
