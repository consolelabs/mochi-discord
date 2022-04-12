import { Command } from "commands"
import {
  ButtonInteraction,
  MessageEditOptions,
  MessageEmbed,
  User,
} from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import {
  DISCORD_ENROLL_ALPHA_CHANNEL,
  DISCORD_ENROLL_AMPAWSSADOR_CHANNEL,
  DISCORD_GM_CHANNEL,
  PREFIX,
} from "env"
import {
  composeSelection,
  getEmbedFooter,
  getEmoji,
  getHelpEmbed,
  getListCommands,
  getPaginatedData,
  getPaginationButtons,
  thumbnails,
} from "utils/discord"

const events = [
  {
    title: `${getEmoji("chest")} Pod Compy`,
    body: `For depositing into one of our vaults.`,
  },
  {
    title: `💬 Chat`,
    body: "Socializing with Podians!",
  },
  {
    title: `${getEmoji("good_morning")} GM/GN`,
    body: `Good morning / Good night (Join at <#${DISCORD_GM_CHANNEL}>)`,
  },
  {
    title: `${getEmoji("devfixpls")} Alpha testing`,
    body: `Testing the alpha version of Pod Town products.\nGet access here -> <#${DISCORD_ENROLL_ALPHA_CHANNEL}>`,
  },
  {
    title: `${getEmoji("neko")} Minting`,
    body: "For those that minted during the Cyber Neko NFT event.",
  },
  {
    title: `${getEmoji("balance")} Sale`,
    body: "For adopting a Neko on a secondary market.",
  },
  {
    title: `${getEmoji("together")} Pod Together`,
    body: "For depositing into one of our pools.",
  },
  {
    title: "🎨 Pod Town community art",
    body: "For participating in the art contest.",
  },
  {
    title: `${getEmoji("auction")} Pod Auction`,
    body: "For bidding in the Auction House.",
  },
  {
    title: `${getEmoji("twitter")} Twitter`,
    body: `For sharing tweets about Pod Town.\nEnroll first at <#${DISCORD_ENROLL_AMPAWSSADOR_CHANNEL}>`,
  },
]

export async function changeXpPage(interaction: ButtonInteraction) {
  try {
    const args = interaction.customId.substring("xp_page_".length).split("|")
    const [pageIndex, authorId] = [+args[0], args[1]]
    const author = await interaction.guild.members.fetch(authorId)

    const editMsg = await loadXpPage(pageIndex, author.user)
    interaction.update(editMsg)
  } catch (e) {
    console.trace(e)
    interaction.channel.send("Something went wrong! Please try again later")
  }
}

async function loadXpPage(
  page: number,
  author: User
): Promise<MessageEditOptions> {
  const pageSize = 9
  const totalPages = Math.ceil(events.length / pageSize)
  const paginatedData = getPaginatedData(events, pageSize, page)

  const embed = new MessageEmbed()
    .setColor("#059669")
    .setDescription(
      `**Events**\nThese are the events that you can participate in to earn xp points, points given is chosen randomly among 4 factions.\n${getEmoji(
        "blank"
      )}`
    )
    .setThumbnail(thumbnails.XP)
    .setFields(composeSelection(paginatedData))

  const pageIndicator = `Page ${page + 1}/${totalPages}`
  embed.setFooter(
    getEmbedFooter([author.tag, pageIndicator]),
    author.avatarURL()
  )

  const customIds = [
    `xp_page_${page - 1}|${author.id}`,
    `xp_page_${page + 1}|${author.id}`,
  ]
  const actionButtons = getPaginationButtons(page, totalPages, customIds)

  return {
    embeds: [embed],
    ...(actionButtons.length && {
      components: [
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: actionButtons,
        },
      ],
    }),
  }
}

const command: Command = {
  id: "xp",
  command: "xp",
  name: "Tracked events",
  category: "Profile",
  canRunWithoutAction: true,
  getHelpMessage: async function () {
    let embedMsg = getHelpEmbed()
      .setTitle(`${PREFIX}xp`)
      .setThumbnail(thumbnails.XP)
      .addField("_Examples_", `\`${PREFIX}xp\``, true)
      .setDescription(
        `\`\`\`View tracked events that grant users xp points.\`\`\`\n${getListCommands(
          "╰ ",
          {
            xp: {
              command: "xp",
              name: `List all tracked events`,
            },
          }
        )}`
      )
    return {
      embeds: [embedMsg],
    }
  },
  run: async function (msg) {
    const events = await loadXpPage(0, msg.author)
    return {
      messageOptions: {
        ...events,
      },
    }
  },
}

export default command
