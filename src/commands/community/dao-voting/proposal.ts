import community from "adapters/community"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { MessageButtonStyles } from "discord.js/typings/enums"
import { APIError } from "errors"
import client from "index"
import { defaultEmojis, getEmoji, intToMonth, intToWeekday } from "utils/common"
import {
  composeButtonLink,
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"

let proposalTitle = ""
let proposalDesc = ""
let proposalExpireIn = ""

export async function handleProposalCancel(i: ButtonInteraction) {
  i.deferUpdate()
  const msg = i.message as Message
  // TODO: attach guideline channel id to button id
  msg.edit({
    embeds: [
      getErrorEmbed({
        title: "Proposal canceled",
        description:
          "The proposal is canceled. Start a new proposal in the <#guideline_channel>",
      }),
    ],
    components: [],
  })
}

function composeProposalCancelButton(): MessageButton {
  return new MessageButton({
    customId: `proposal-cancel`,
    emoji: getEmoji("revoke"),
    style: "SECONDARY",
    label: "Cancel",
  })
}

// clicked from DM
export async function handleProposalCreate(i: ButtonInteraction) {
  i.deferUpdate()
  const args = i.customId.split("-")
  const guild_id = args[2]

  // get dao voting channel configs
  const {
    data: cfgData,
    ok: cfgOk,
    error: cfgErr,
    curl: cfgCurl,
  } = await community.getGuildConfigDaoProposal(guild_id)
  if (!cfgOk) {
    throw new APIError({ curl: cfgCurl, error: cfgErr })
  }

  // create proposal, generate discussion channel and get id
  const { data, ok, error, curl } = await community.createProposal({
    creator_id: i.user.id,
    description: proposalDesc,
    guild_id,
    title: proposalTitle,
    voting_channel_id: cfgData.proposal_channel_id ?? "",
  })
  if (!ok) {
    throw new APIError({ curl, error })
  }

  await i.editReply({
    embeds: [
      getSuccessEmbed({
        title: "Proposal successfully submitted",
        description: `${defaultEmojis.POINT_RIGHT} Your proposal has been recorded in the <#${cfgData.proposal_channel_id}>.\n${defaultEmojis.POINT_RIGHT} You can create a new proposal in the <#${cfgData.guideline_channel_id}>.\n${defaultEmojis.POINT_RIGHT} You can join the discussion about your proposal in the <#${data.discussion_channel_id}>`,
      }),
    ],
    components: [],
  })

  // interacted from DM, need to get guild client
  const guild = await client.guilds.fetch(guild_id)
  const proposalChannel = await guild.channels.fetch(
    cfgData.proposal_channel_id ?? ""
  )
  const actionRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `test`,
      style: "PRIMARY",
      label: "Yes",
    }),
    new MessageButton({
      customId: `test1`,
      style: "PRIMARY",
      label: "No",
    }),
    new MessageButton({
      customId: `test2`,
      style: "PRIMARY",
      label: "Abstain",
    }),
    new MessageButton({
      style: MessageButtonStyles.LINK,
      label: "Discuss",
      url: `https://discord.com/channels/863278424433229854/${data.discussion_channel_id}`,
    })
  )

  // post proposal to channel
  if (proposalChannel?.type === "GUILD_TEXT") {
    const msg = await proposalChannel.send({
      content: `> @everyone vote for the new proposal`,
      embeds: [
        composeEmbedMessage(null, {
          title: `${getEmoji("MAIL")} ${proposalTitle.toUpperCase()}`,
          description: `${proposalDesc}\n\nVoting will close at: <t:${proposalExpireIn}>`,
        }),
      ],
      components: [actionRow],
    })
  }
}

// clicked from guild
export async function handleProposalForm(i: ButtonInteraction) {
  i.deferReply()

  // TODO: check if user connect wallet
  const userConnected = true
  if (!userConnected) {
    i.reply({
      ephemeral: true,
      embeds: [
        getErrorEmbed({
          title: "Wallet not connected",
          description:
            "Please [Connect your wallet](https://www.google.com/) to gain the authority to create a proposal. ",
        }),
      ],
    }).catch(() => null)
  }

  // TODO: check user met token requirements to post proposal
  const userValidated = true
  if (!userValidated) {
    i.reply({
      ephemeral: true,
      embeds: [
        getErrorEmbed({
          title: "Insufficient token amount",
          description:
            "You need to own at least 50 **FTM** to post a proposal.",
        }),
      ],
    }).catch(() => null)
  }

  // TODO: check user need admin permission to post proposal
  const userIsAdmin = false
  if (!userIsAdmin) {
    i.reply({
      ephemeral: true,
      embeds: [
        getErrorEmbed({
          title: "Permissions required",
          description: `Only Administrators can use this command ${getEmoji(
            "NEKOSAD"
          )}.\nPlease contact your server admins if you need help.`,
        }),
      ],
    }).catch(() => null)
  }

  const dm = await i.user.send({
    embeds: [
      composeEmbedMessage(null, {
        title: `${getEmoji("QUESTION")} Please enter your proposal title.`,
      }),
    ],
    components: [
      new MessageActionRow().addComponents(composeProposalCancelButton()),
    ],
  })

  i.reply({
    ephemeral: true,
    embeds: [
      composeEmbedMessage(null, {
        title: `${getEmoji("MAIL")} Proposal Submission`,
        description:
          "The proposal submission will be processed in your DM. Please check your DM!",
      }),
    ],
    components: [composeButtonLink("See the DM", dm.url)],
  }).catch(() => null)
  // get data from dm messages
  proposalTitle = await getProposalTitle(i.user.id, dm)
  proposalDesc = await getProposalDescription(i.user.id, dm)
  const proposalDuration = (
    await getProposalDuration(i.user.id, dm)
  ).toLowerCase()
  const currentTime = Date.now()
  // duration ends in hH or dD
  if (proposalDuration.includes("h")) {
    const hours = parseInt(
      proposalDuration.slice(0, proposalDuration.length - 1)
    )
    proposalExpireIn = (
      Math.floor(currentTime / 1000) +
      hours * 3600
    ).toString()
  } else {
    const days = parseInt(
      proposalDuration.slice(0, proposalDuration.length - 1)
    )
    proposalExpireIn = (
      Math.floor(currentTime / 1000) +
      days * 24 * 3600
    ).toString()
  }

  // send confirmation
  const actionRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `proposal-confirm-${i.guildId}`,
      style: "PRIMARY",
      label: "Submit",
    }),
    composeProposalCancelButton()
  )
  await i.user.send({
    content: "> Proposal preview",
    embeds: [
      composeEmbedMessage(null, {
        title: proposalTitle,
        description: `${proposalDesc}\n\nVoting will close at: <t:${proposalExpireIn}>`,
      }),
    ],
    components: [actionRow],
  })
}

async function getProposalTitle(
  authorId: string,
  dm: Message
): Promise<string> {
  const filter = (collected: Message) => collected.author.id === authorId
  const collected = await dm.channel.awaitMessages({
    max: 1,
    filter,
  })
  const userReply = collected.first()

  // ask for description
  await dm.channel.send({
    embeds: [
      composeEmbedMessage(null, {
        title: `${getEmoji(
          "QUESTION"
        )} Please enter your proposal description.`,
        description: "Word limit: 2000 words",
      }),
    ],
    components: [
      new MessageActionRow().addComponents(composeProposalCancelButton()),
    ],
  })
  return userReply?.content?.trim() ?? ""
}

async function getProposalDescription(
  authorId: string,
  dm: Message
): Promise<string> {
  const filter = (collected: Message) => collected.author.id === authorId
  const collected = await dm.channel.awaitMessages({
    max: 1,
    filter,
  })
  const userReply = collected.first()

  // ask for duration
  await dm.channel.send({
    embeds: [
      composeEmbedMessage(null, {
        title: `${getEmoji(
          "QUESTION"
        )} Please enter the duration of your proposal.`,
        description: "You can enter the duration in hours or days (h, d)",
      }),
    ],
    components: [
      new MessageActionRow().addComponents(composeProposalCancelButton()),
    ],
  })
  return userReply?.content?.trim() ?? ""
}

async function getProposalDuration(
  authorId: string,
  dm: Message
): Promise<string> {
  const filter = (collected: Message) => collected.author.id === authorId
  const collected = await dm.channel.awaitMessages({
    max: 1,
    filter,
  })
  const userReply = collected.first()

  // accept hours OR days
  const regex = /([1-9][0-9]*[hH])|([1-9][0-9]*[dD])/
  if (!userReply?.content.match(regex)) {
    await userReply?.reply({
      embeds: [
        getErrorEmbed({
          title: "Invalid duration",
          description: "Duration should be in h (hour) or d (day)",
        }),
      ],
    })
    await getProposalDuration(authorId, dm)
  }
  return userReply?.content?.trim() ?? ""
}
