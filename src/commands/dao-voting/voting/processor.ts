import community from "adapters/community"
import { ButtonInteraction } from "discord.js"
import { APIError } from "errors"
import { getEmoji } from "utils/common"
import { getErrorEmbed, getSuccessEmbed } from "ui/discord/embed"
import profile from "adapters/profile"

export async function handleProposalVote(i: ButtonInteraction) {
  await i.deferReply({ ephemeral: true })
  if (!i.member || !i.guild) return
  const args = i.customId.split("-") //proposal-vote-yes-${data.id}-${creator_id}
  const choice = args[2]
  const proposal_id = args[3]
  const user_id = i.user.id

  // check if user connect wallet
  const {
    data: wData,
    ok: wOk,
    error: wError,
    curl: wCurl,
    log: wLog,
  } = await community.getDaoVoterStatus(
    proposal_id,
    user_id,
    i.guildId ?? "",
    "vote"
  )
  if (!wOk) {
    throw new APIError({ curl: wCurl, description: wLog, error: wError })
  }
  if (wData.is_wallet_connected === false) {
    const json = await profile.generateVerificationCode(
      i.member.user.id,
      i.guild.id
    )
    const code = !json.error ? json.code : ""
    return await i
      .editReply({
        embeds: [
          getErrorEmbed({
            title: "Wallet not connected",
            description: `Please [Connect your wallet](https://mochi.gg/verify?code=${code}) to gain the authority to vote.`,
          }),
        ],
      })
      .catch(() => null)
  }
  if (wData.is_qualified === false) {
    return await i
      .editReply({
        embeds: [
          getErrorEmbed({
            title: "Insufficient token amount",
            description: `You need to own ${wData.vote_config.required_amount} **${wData.vote_config.symbol}** to vote for the proposal. `,
          }),
        ],
      })
      .catch(() => null)
  }

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
        description: `You have updated your vote successfully ${choice} for**${i.message.embeds[0].title?.replace(
          getEmoji("MAIL"),
          ""
        )}**. Thank you for your vote ${getEmoji("HEART")}`,
      }),
    ],
  })
}
