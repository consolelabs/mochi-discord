import community from "adapters/community"
import { CommandInteraction, Message } from "discord.js"
import { APIError } from "errors"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
// import { composeSimpleSelection } from "ui/discord/select-menu"

export async function handleSalesList(
  msg: Message | CommandInteraction,
  guildId: string
) {
  const res = await community.getSalesTrackers(guildId)
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: res.log,
    })
  }
  if (!res.data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No tracker found!",
            description: `You haven't set up any sales trackers yet.\n${getEmoji(
              "POINTINGRIGHT"
            )} To set a new one, run \`sales track <channel> <address> <chain_id>\` (or \`<chain_symbol>\`).\n${getEmoji(
              "POINTINGRIGHT"
            )} Then re-check your configuration using \`sales list\`.`,
          }),
        ],
      },
    }
  }

  const description = res.data
    .map(
      (c: any) =>
        `<#${c.channel_id}> \`(${shortenHashOrAddress(c.contract_address)}) ${
          c.chain
        }\``
    )
    .join("\n")

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
