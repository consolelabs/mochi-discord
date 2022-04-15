import { Event } from "."
import Discord from "discord.js"
import { invites } from "./index"


export default {
  name: "inviteCreate",
  once: false,
  execute: async (invite: Discord.Invite) => {
    (invites.get(invite.guild.id) as Discord.Collection<string,number>).set(invite.code, invite.uses);
  },
} as Event<"inviteCreate">