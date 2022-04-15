import { Event } from "."
import Discord from "discord.js"
import { invites } from "./index"

export default {
  name: "inviteDelete",
  once: false,
  execute: async (invite: Discord.Invite) => {
    (invites.get(invite.guild.id) as Discord.Collection<string, number>).delete(invite.code);
  },
} as Event<"inviteDelete">