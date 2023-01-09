import community from "adapters/community"
import { ButtonInteraction } from "discord.js"
import { APIError } from "errors"
import { getEmoji } from "utils/common"
import { getSuccessEmbed } from "utils/discordEmbed"

export async function handleProposalVote(i: ButtonInteraction) {
  i.deferReply()
  const args = i.customId.split("-") //proposal-vote-yes-${data.id}-${i.user.id}
  const choice = args[2]
  const proposal_id = args[3]
  const user_id = args[4]
  // get user vote
  const { data, error } = await community.getUserProposalVote(
    user_id,
    proposal_id
  )
  // vote not found -> create new
  if (data === null || error === "record not found") {
    const { ok, curl, error, log } = await community.createUserProposalVote({
      user_id,
      proposal_id: parseInt(proposal_id),
      choice,
    })
    if (!ok) {
      throw new APIError({ curl, description: log, error })
    }
    await i.reply({
      ephemeral: true,
      embeds: [
        getSuccessEmbed({
          title: "Successfully voted",
          description: `You have voted ${choice} for **${
            i.message.embeds[0].title
          }**. Thank you for your vote ${getEmoji("HEART")}`,
        }),
      ],
    })
  }
  // vote found -> update
  else {
    const { ok, curl, error, log } = await community.UpdateUserProposalVote(
      data.id,
      { user_id, choice }
    )
    if (!ok) {
      throw new APIError({ curl, description: log, error })
    }
    // user change vote before ephemeral disappear => edit reply
    await i
      .reply({
        ephemeral: true,
        embeds: [
          getSuccessEmbed({
            title: "Successfully voted",
            description: `You have updated your vote successfully ${choice} for **${i.message.embeds[0].title?.slice(
              6
            )}**. Thank you for your vote ${getEmoji("HEART")}`,
          }),
        ],
      })
      .catch(async () => {
        // ISSUE: not edit but send another reply
        await i.editReply({
          embeds: [
            getSuccessEmbed({
              title: "Successfully voted",
              description: `You have updated your vote successfully ${choice} for **${i.message.embeds[0].title?.slice(
                6
              )}**. Thank you for your vote ${getEmoji("HEART")}`,
            }),
          ],
        })
      })
  }
}
