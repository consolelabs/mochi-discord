import community from "adapters/community"
import { ButtonInteraction } from "discord.js"
import { APIError } from "errors"
import { getEmoji } from "utils/common"
import { getSuccessEmbed } from "utils/discordEmbed"

export async function handleProposalVote(i: ButtonInteraction) {
  await i.deferReply({ ephemeral: true })
  const args = i.customId.split("-") //proposal-vote-yes-${data.id}-${i.user.id}
  const choice = args[2]
  const proposal_id = args[3]
  const user_id = args[4]
  // get user vote
  const { data, error: getProposalErr } = await community.getUserProposalVote(
    user_id,
    proposal_id
  )
  let res
  // vote not found -> create new
  if (data === null || getProposalErr === "record not found") {
    res = await community.createUserProposalVote({
      user_id,
      proposal_id: parseInt(proposal_id),
      choice,
    })
  }
  // vote found -> update
  else {
    res = await community.UpdateUserProposalVote(data.id, { user_id, choice })
  }
  const { ok, curl, error, log } = res
  if (!ok) {
    throw new APIError({ curl, description: log, error })
  }

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
}
