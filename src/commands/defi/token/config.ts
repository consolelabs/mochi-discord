import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton
} from "discord.js"
import { Command } from "types/common"
import { Token } from "types/defi"
import { getCommandArguments } from "utils/commands"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getExitButton } from "utils/discordEmbed"
import Config from "../../../adapters/config"

export async function updateGuildTokenConfig(
  interaction: ButtonInteraction,
  msg: Message
) {
  await interaction.deferUpdate()

  const [_prefix, symbol, authorId, activeArg] = interaction.customId.split("-")
  if (interaction.user.id !== authorId) {
    return
  }

  const active = JSON.parse(activeArg)
  await Config.updateTokenConfig({
    guild_id: interaction.guildId,
    symbol,
    active
  })

  await msg.edit({
    embeds: [
      composeEmbedMessage(msg, {
        description: `Successfully ${
          active ? "added" : "removed"
        } **${symbol.toUpperCase()}** to guild's tokens list`
      })
    ],
    components: []
  })
}

const command: Command = {
  id: "token_guild_configs",
  command: "config",
  brief: "View/update your guild's tokens list",
  category: "Community",
  run: async msg => {
    const args = getCommandArguments(msg)
    const symbol = args[2]
    if (!symbol) {
      const data = await Config.getGuildTokens(msg.guildId)
      const description = data
        .map((token: Token) => {
          const tokenEmoji = getEmoji(token.symbol)
          return `${tokenEmoji} **${token.symbol.toUpperCase()}**`
        })
        .join("\n")
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "Guild's tokens list",
              description
            })
          ]
        }
      }
    }

    const components = [
      new MessageActionRow().addComponents(
        new MessageButton({
          customId: `guild_token_config-${symbol}-${msg.author.id}-true`,
          label: "Add",
          style: "SUCCESS"
        }),
        new MessageButton({
          customId: `guild_token_config-${symbol}-${msg.author.id}-false`,
          label: "Remove",
          style: "DANGER"
        }),
        getExitButton()
      )
    ]

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Update tokens list",
            description: `Choose to add/remove **${symbol.toUpperCase()}** to/from **${
              msg.guild.name
            }'s** tokens list`
          })
        ],
        components
      }
    }
  },
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens config\n${PREFIX}tokens config <symbol>`,
        examples: `${PREFIX}tokens config\n${PREFIX}tokens config ftm\n${PREFIX}tokens config FTM`
      })
    ]
  }),
  canRunWithoutAction: true,
  aliases: ["cfg", "configs"]
}

export default command
