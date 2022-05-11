import { Event } from "."
import Discord from "discord.js"
import { invites } from "./index"
import { logger } from "logger"
import ChannelLogger from "utils/ChannelLogger"
import { BotBaseError } from "errors"

export default {
  name: "inviteCreate",
  once: false,
  execute: async (invite: Discord.Invite) => {
    try {
      (invites.get(invite.guild.id) as Discord.Collection<string, number>).set(
        invite.code,
        invite.uses
      )
    } catch (e: any) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e)
      }
      ChannelLogger.log(e)
    }
  }
} as Event<"inviteCreate">

