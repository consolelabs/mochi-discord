import community from "adapters/community"
import { CommandInteraction, Message } from "discord.js"
import { APIError } from "errors"
import { defaultEmojis, shortenHashOrAddress } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
// import { composeSimpleSelection } from "ui/discord/select-menu"

export async function handleSalesList(
  msg: Message | CommandInteraction,
  guildId: string
) {
  const res = await community.getSalesTrackers(guildId)
  if (!res.ok) {
    throw new APIError({ message: msg, curl: res.curl, description: res.log })
  }
  if (!res.data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No tracker found!",
            description: `You haven't set up any sales trackers yet.\n${defaultEmojis.POINT_RIGHT} To set a new one, run \`sales track <channel> <address> <chain_id>\` (or \`<chain_symbol>\`).\n${defaultEmojis.POINT_RIGHT} Then re-check your configuration using \`sales list\`.`,
          }),
        ],
      },
    }
  }

  let description = ""
  res.data.map((c: any) => {
    c.contract_address = shortenHashOrAddress(c.contract_address)
    description += `<#${c.channel_id}> \`(${c.contract_address}) ${c.chain}\`\n`
  })

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: "Trackers",
          description: `Sending notifications to\n${description}`,
        }),
      ],
    },
  }
}
