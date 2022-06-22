import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import community from "adapters/community"
import { getCommandArguments } from "utils/commands"

const command: Command = {
  id: "whitelist_check",
  command: "check",
  brief: "Show whitelist status of a specific user",
  category: "Community",
  run: async (msg: Message) => {
    let description = ""
    const args = getCommandArguments(msg)
    if (args.length < 4) {
      return
    }
    if (!parseInt(args[2])) {
      return
    }
    if (!args[3].startsWith("<@") || !args[3].endsWith(">")) {
      return
    }

    const campaignId = args[2].replace(/\D/g, "")
    const userDiscordId = args[3].replace(/\D/g, "")

    const res = await community.getWhitelistWinnerInfo(
      userDiscordId,
      campaignId
    )

    if (res?.error) {
      description = `**User <@${userDiscordId}> has not been whitelisted yet** ❌`
    }

    if (res?.discord_id) {
      description = `**User <@${userDiscordId}> has already whitelisted** ✅`
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}wl check <campaign_id> @<username>`,
          examples: `${PREFIX}wl check 8 @mochi01`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Command",
}

export default command
