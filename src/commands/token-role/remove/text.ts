import config from "adapters/config"
import { MessageSelectOptionData } from "discord.js"
import { APIError, GuildIdNotFoundError, InternalError } from "errors"
import { Command } from "types/common"
import { composeDiscordExitButton } from "ui/discord/button"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { PREFIX, TOKEN_ROLE_GITBOOK } from "utils/constants"
import { list } from "../processor"
import { handler } from "./processor"

const command: Command = {
  id: "tr_remove",
  command: "remove",
  brief: "Remove a token role setup",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg) => {
    if (!msg.guild || !msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const { ok, data, log, curl, error } = await config.getConfigTokenRoleList(
      msg.guildId
    )
    if (!ok) {
      throw new APIError({ message: msg, description: log, curl, error })
    }
    if (data.length === 0) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: `No Token roles found`,
              description: `No Token roles found! To set a new one, run \`\`\`${PREFIX}tr set <role> <amount> <token_address> <chain_name>\`\`\``,
            }),
          ],
        },
      }
    }

    const options: MessageSelectOptionData[] = []
    for (const config of data) {
      if (!config.role_id) {
        throw new InternalError({
          message: msg,
          description: "invalid role id",
        })
      }
      const role = await msg.guild?.roles.fetch(config.role_id)
      options.push({
        label: role?.name ?? "NA",
        value: `${config.id ?? ""}|${role?.name ?? ""}`,
      })
    }
    const { description } = list({ data })
    const embed = composeEmbedMessage(msg, {
      title: "Select an option",
      description,
    })

    return {
      messageOptions: {
        embeds: [embed],
        components: [
          composeDiscordSelectionRow({
            customId: "tokenrole_remove",
            placeholder: "Select a tokenrole",
            options,
          }),
          composeDiscordExitButton(msg.author.id),
        ],
      },
      interactionOptions: {
        handler,
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tr remove`,
        examples: `${PREFIX}tr remove`,
        document: `${TOKEN_ROLE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
