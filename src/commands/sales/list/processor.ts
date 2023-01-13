import community from "adapters/community"
import { CommandInteraction, Message } from "discord.js"
import { APIError } from "errors"
import { capFirst, defaultEmojis, shortenHashOrAddress } from "utils/common"
import { composeEmbedMessage } from "discord/embed/ui"
import { composeSimpleSelection } from "discord/select-menu/ui"

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
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: "Trackers",
          description: `Sending notifications to channel <#${
            res.data.channel_id
          }>:\n${composeSimpleSelection(
            res.data.collection.map(
              (c: any) =>
                `\`${capFirst(c.name)} (${shortenHashOrAddress(
                  c.contract_address
                )}) ${c.chain.name}\``
            )
          )}`,
        }),
      ],
    },
  }
}
