import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { API_BASE_URL } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getCommandArguments } from "utils/commands"
import { composeLevelUpMessage } from "utils/userXP"
import fetch from "node-fetch"

const command: Command = {
  id: "gift",
  command: "gift",
  brief: "Gift",
  category: "Community",
  onlyAdministrator: true,
  run: async function(msg) {
    const args = getCommandArguments(msg)
    if (args.length < 4) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
    const errorMessage = `Cannot send gift XP. `
    if (args[3].toLowerCase() != "xp") {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              color: "#D73833",
              title: "Gift XP",
              description: `You can only send XP as gift.`
            })
          ]
        }
      }
    }

    if (parseInt(args[2]) <= 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              color: "#D73833",
              title: "Gift XP",
              description: `Invalid XP amount.`
            })
          ]
        }
      }
    }

    const adminDiscordId = msg.author.id
    const guildId = msg.guildId
    const userDiscordId = args[1].replace("<@", "").replace(">", "")
    const xpAmount = args[2]

    const giftXpRequest = {
      admin_discord_id: adminDiscordId,
      user_discord_id: userDiscordId,
      guild_id: guildId,
      xp_amount: xpAmount
    }

    // get data nft from server
    const respGiftXp = await fetch(`${API_BASE_URL}/gift/xp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(giftXpRequest)
    })
    const dataGiftXp = await respGiftXp.json()
    const errorMessageGiftXp = dataGiftXp.error
    switch (respGiftXp.status) {
      case 200:
        await msg.channel.send({
          embeds: [
            composeEmbedMessage(msg, {
              title: "Gift XP",
              description: `<@${adminDiscordId}> has sent ${xpAmount} XP as gift for <@${userDiscordId}>`
            })
          ]
        })

        if (dataGiftXp.data.level_up) {
          await msg.channel.send(
            await composeLevelUpMessage(
              userDiscordId,
              msg.mentions.users.get(userDiscordId).avatar,
              dataGiftXp.data.current_level
            )
          )
        }
        return
      case 400:
        if (errorMessageGiftXp.includes("not found")) {
          return {
            messageOptions: {
              embeds: [
                composeEmbedMessage(msg, {
                  color: "#D73833",
                  title: "Gift XP",
                  description: errorMessage + `User is not in server.`
                })
              ]
            }
          }
        }
      default:
        return {
          messageOptions: {
            embeds: [
              composeEmbedMessage(msg, {
                title: "Gift XP",
                description: errorMessage
              })
            ]
          }
        }
    }
  },
  getHelpMessage: async msg => {
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}gift`,
      footer: [`Type ${PREFIX}help gift`],
      examples: `${PREFIX}gift <@user> 5 xp`
    })

    return { embeds: [embed] }
  }
}

export default command
