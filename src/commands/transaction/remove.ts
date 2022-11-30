import { Command } from "types/common"
import { Message, CommandInteraction, SelectMenuInteraction } from "discord.js"
import {
  composeDiscordSelectionRow,
  composeDiscordExitButton,
  composeEmbedMessage,
  getSuccessEmbed,
} from "utils/discordEmbed"
import { getEmoji, thumbnails } from "utils/common"
import { PREFIX } from "utils/constants"
import { GuildIdNotFoundError } from "errors/GuildIdNotFoundError"
import Defi from "adapters/defi"
import { APIError } from "errors/APIError"
import { InteractionHandler } from "utils/InteractionManager"

export async function handle(msg: Message | CommandInteraction, data: any) {
  const selectRow = composeDiscordSelectionRow({
    customId: "transaction_remove",
    placeholder: "Select config",
    options: data.map((config: any) => {
      const token =
        config.token.toUpperCase() == "*"
          ? "All tokens"
          : config.token.toUpperCase()
      return {
        label: `${token} | <#${config.channel_id}>`,
        value: `${config.id} | ${config.guild_id} | ${token} | <#${config.channel_id}>`,
      }
    }),
  })

  let authorId = ""
  if (msg instanceof Message) {
    authorId = msg.author.id
  } else {
    authorId = msg.user.id
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Choose one tracker to remove "],
          description: "Please select which tracker you want to remove",
        }),
      ],
      components: [selectRow, composeDiscordExitButton(authorId)],
    },
    interactionOptions: {
      handler: transactionSelectionHandler,
    },
  }
}

export const transactionSelectionHandler: InteractionHandler = async (
  msgOrInteraction
) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const configId = input.split(" | ")[0]
  const guildId = input.split(" | ")[1]

  await Defi.deleteConfigNofityTransaction(configId)

  const { data, ok, error, curl, log } =
    await Defi.getListConfigNofityTransaction({ guild_id: guildId })

  if (!ok) {
    throw new APIError({ message: message, curl, description: log, error })
  }

  const embed = data
    .map((config: any) => {
      const token =
        config.token.toUpperCase() == "*"
          ? "All tokens"
          : config.token.toUpperCase()
      return `<#${config.channel_id}>\n${getEmoji("reply")} ${token} | ${
        config.total_transaction
      } transactions`
    })
    .join("\n")

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Succesfully removed",
          description: `:point_right: To set the new tracker, use \`$transaction track <token> <#channel>\`.\n:point_right: Current tracker\n${embed}`,
        }),
      ],
      components: [],
    },
  }
}

const command: Command = {
  id: "transaction_remove",
  command: "remove",
  brief: "Remove the transaction tracker",
  category: "Defi",
  run: async (msg) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({})
    }

    const { data, ok, error, curl, log } =
      await Defi.getListConfigNofityTransaction({ guild_id: msg.guildId })

    if (!ok) {
      throw new APIError({ message: msg, curl, description: log, error })
    }

    if (data.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: `${getEmoji("TRANSACTIONS")} Transaction tracker`,
              description: `There's not any transaction yet.`,
            }),
          ],
        },
      }
    }

    return await handle(msg, data)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Remove the transaction tracker ",
        usage: `${PREFIX}transaction remove`,
        examples: `${PREFIX}transaction remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  onlyAdministrator: true,
}

export default command
