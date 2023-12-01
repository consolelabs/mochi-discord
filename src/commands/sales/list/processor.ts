import community from "adapters/community"
import { CommandInteraction, Message } from "discord.js"
import { APIError } from "errors"
import { getEmoji, msgColors, shortenHashOrAddress } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
// import { composeSimpleSelection } from "ui/discord/select-menu"

export async function handleSalesList(
  msg: Message | CommandInteraction,
  guildId: string,
) {
  const res = await community.getSalesTrackers(guildId)
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: res.log,
      status: res.status ?? 500,
      error: res.error,
    })
  }
  if (!res.data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No tracker found!",
            description: `You haven't set up any sales trackers yet.\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} To set a new one, run \`sales track <channel> <address> <chain_id>\` (or \`<chain_symbol>\`).\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} Then re-check your configuration using \`sales list\`.`,
            color: msgColors.PINK,
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
        }\``,
    )
    .join("\n")

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: "Trackers",
          description: `Sending notifications to\n${description}`,
          color: msgColors.PINK,
        }),
      ],
    },
  }
}
