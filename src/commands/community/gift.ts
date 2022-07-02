import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { getCommandArguments } from "utils/commands"
import community from "adapters/community"

const command: Command = {
  id: "gift",
  command: "gift",
  brief: "Gift",
  category: "Community",
  onlyAdministrator: true,
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const [userArg, xpAmountArg, giftType] = args.slice(1)
    if (giftType.toLowerCase() !== "xp") {
      const errorEmbed = getErrorEmbed({
        msg,
        title: "Gift XP",
        description: `You can only send XP as gift.`,
      })
      return {
        messageOptions: {
          embeds: [errorEmbed],
        },
      }
    }

    const xpAmount = parseInt(xpAmountArg)
    if (!xpAmount || xpAmount < 0) {
      const errorEmbed = getErrorEmbed({
        msg,
        title: "Gift XP",
        description: `Invalid XP amount.`,
      })
      return { messageOptions: { embeds: [errorEmbed] } }
    }

    const adminDiscordId = msg.author.id
    const guildId = msg.guildId
    const userDiscordId = userArg.replace("<@", "").replace(">", "")

    const giftXpRequest = {
      admin_discord_id: adminDiscordId,
      channel_id: msg.channelId,
      user_discord_id: userDiscordId,
      guild_id: guildId,
      xp_amount: xpAmount,
    }

    await community.giftXp(giftXpRequest)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Gift XP",
            description: `<@${adminDiscordId}> has sent ${xpAmount} XP as gift for <@${userDiscordId}>`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}gift`,
      footer: [`Type ${PREFIX}help gift`],
      examples: `${PREFIX}gift <@user> 5 xp`,
    })

    return { embeds: [embed] }
  },
  colorType: "Command",
  minArguments: 4,
}

export default command
