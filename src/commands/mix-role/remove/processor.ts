import config from "adapters/config"
import {
  CommandInteraction,
  Message,
  MessageEmbed,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import {
  APIError,
  GuildIdNotFoundError,
  InternalError,
  OriginalMessage,
} from "errors"
import { InteractionHandler } from "handlers/discord/select-menu"
import {
  composeEmbedMessage,
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { PREFIX, SLASH_PREFIX } from "utils/constants"
import { list } from "../processor"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { composeDiscordExitButton } from "ui/discord/button"
import { msgColors } from "utils/common"

export async function process(msg: OriginalMessage) {
  const isTextCommand = msg instanceof Message
  const prefix = isTextCommand ? PREFIX : SLASH_PREFIX
  const userId = isTextCommand ? msg.author.id : msg.user.id

  if (!msg.guildId || !msg.guild) {
    throw new GuildIdNotFoundError({ message: msg })
  }
  const { ok, error, data, log, curl } = await config.getConfigMixRoleList({
    guild_id: msg.guildId,
  })
  if (!ok) {
    throw new APIError({
      msgOrInteraction: msg,
      description: log,
      curl,
      error,
    })
  }
  if (data.length === 0) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: `No mix roles found`,
            description: `No mix roles found! To set a new one, run \`${prefix}mr set\``,
          }),
        ],
      },
    }
  }

  const options: MessageSelectOptionData[] = []
  for (const config of data) {
    if (!config.role_id) {
      throw new InternalError({
        msgOrInteraction: msg,
        description: "invalid role id",
      })
    }
    const role = await msg.guild?.roles.fetch(config.role_id)
    options.push({
      label: role?.name ?? "NA",
      value: `${config.id ?? ""}|${role?.name ?? ""}`,
    })
  }
  const { description, fields } = list({ data })
  let embed: MessageEmbed
  if (isTextCommand) {
    embed = composeEmbedMessage(msg, {
      title: "Select an option",
      description,
      color: msgColors.PINK,
    })
  } else {
    embed = composeEmbedMessage2(msg as CommandInteraction, {
      title: "Select an option",
      description: list({ data }).description,
      color: msgColors.PINK,
    })
  }
  embed.addFields(fields)

  return {
    messageOptions: {
      embeds: [embed],
      components: [
        composeDiscordSelectionRow({
          customId: "mixrole_remove",
          placeholder: "Select a mixrole",
          options,
        }),
        composeDiscordExitButton(userId),
      ],
    },
    interactionOptions: {
      handler,
    },
  }
}

export const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const msg = msgOrInteraction as Message
  const [configId, name] = interaction.values[0].split("|")
  await config.removeGuildMixRoleConfig(configId)
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          msg,
          title: `Successfully removed ${name}!`,
          description: `You can set the new role by using \`$mixrole set\``,
        }),
      ],
      components: [],
    },
  }
}
