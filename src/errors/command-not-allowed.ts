import { getEmoji, getEmojiURL, msgColors } from "utils/common"
import { DOT } from "utils/constants"
import { BotBaseError, OriginalMessage } from "./base"
import { getErrorEmbed } from "ui/discord/embed"
import config from "adapters/config"
import CacheManager from "cache/node-cache"
import { getSlashCommand } from "utils/commands"

export class CommandNotAllowedToRunError extends BotBaseError {
  private missingPermissions: string[]

  constructor({
    message,
    command,
    missingPermissions = [],
  }: {
    message: OriginalMessage
    command: string
    missingPermissions?: string[]
  }) {
    super(message)
    this.name = "Command not allowed to run"
    this.missingPermissions = missingPermissions
    this.message = JSON.stringify({
      guild: this.guild,
      channel: this.channel,
      user: this.user,
      data: { command },
    })
  }

  handle() {
    let errorEmbed
    if (this.missingPermissions?.length) {
      CacheManager.get({
        pool: "bot-manager",
        key: `guild-${this.msgOrInteraction?.guildId}`,
        call: () =>
          config.getGuildAdminRoles({
            guildId: this.msgOrInteraction?.guildId ?? "",
          }),
      }).then(async ({ data }) => {
        errorEmbed = getErrorEmbed({
          emojiUrl: getEmojiURL("675026602479976488"),
          title: "Holdup!",
          description: `:warning: This command can only be used by the following:warning:\n**${DOT} Administrators**${
            data
              ? `\n${(data ?? [])
                  .map((d: any) => `**${DOT} <@&${d.role_id}>**`)
                  .join("\n")}`
              : ""
          }\n\n${getEmoji(
            "ANIMATED_POINTING_RIGHT"
          )} Contact this server's owner to use ${await getSlashCommand(
            "bot-manager set"
          )} to add your role as a bot manager role.`,
          color: msgColors.YELLOW,
        })
        const msgOptions = {
          embeds: [errorEmbed],
        }
        this.reply?.(msgOptions)
      })
    } else {
      errorEmbed = getErrorEmbed({
        description: `This command is not allowed to run in DM`,
      })

      const msgOptions = {
        embeds: [errorEmbed],
      }
      this.reply?.(msgOptions)
    }
  }
}
