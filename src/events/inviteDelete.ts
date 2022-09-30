import { DiscordEvent } from "."
import { invites } from "utils/invites"
import { wrapError } from "utils/wrapError"

const event: DiscordEvent<"inviteDelete"> = {
  name: "inviteDelete",
  once: false,
  execute: async (invite) => {
    wrapError(null, async () => {
      if (invite.guild?.id) {
        const invitesCollection = invites.get(invite.guild.id)
        invitesCollection?.delete(invite.code)
      }
    })
  },
}

export default event
