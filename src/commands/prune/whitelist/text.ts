import { Message } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX, PRUNE_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "discord/embed/ui"
import { getExcludedRoles } from "../processor"
import { createWhitelist, whitelistRolesEmbed } from "./processor"

const command: Command = {
  id: "prune_safelist",
  command: "safelist",
  brief: "Safelist a role from being pruned",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    //$prune whitelist
    if (args.length == 2) {
      const roles = await getExcludedRoles(msg.guild)
      const embed = await whitelistRolesEmbed(roles)
      return {
        messageOptions: {
          embeds: [embed],
        },
      }
    }

    const { isRole, value: id } = parseDiscordToken(args[2])
    if (!isRole) {
      throw new InternalError({
        message: msg,
        title: "Command error",
        description:
          "Invalid role. Be careful not to be mistaken role with username while using `@`.",
      })
    }

    await createWhitelist(id, msg)

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Successfully set!",
            description: `<@&${id}> successfully safelisted`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}prune safelist <role>\n${PREFIX}prune safelist`,
        examples: `${PREFIX}prune safelist\n${PREFIX}prune safelist @Mochi`,
        includeCommandsList: true,
        document: `${PRUNE_GITBOOK}&action=whitelist`,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
