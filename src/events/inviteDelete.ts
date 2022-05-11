import { Event } from "."
import Discord from "discord.js"
import { invites } from "./index"
import { BotBaseError } from "errors"
import { logger } from "logger"
import ChannelLogger from "utils/ChannelLogger"

export default {
  name: "inviteDelete",
  once: false,
  execute: async (invite: Discord.Invite) => {
    try {
      (invites.get(invite.guild.id) as Discord.Collection<
        string,
        number
      >).delete(invite.code)
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
} as Event<"inviteDelete">

