import { DiscordEvent } from "."
import { invites } from "./index"
import { wrapError } from "utils/wrapError"

const event: DiscordEvent<"inviteCreate"> = {
  name: "inviteCreate",
  once: false,
  execute: async (invite) => {
    wrapError(null, async () => {
      if (invite.guild?.id && typeof invite.uses === "number") {
        const invitesCollection = invites.get(invite.guild.id)

        invitesCollection?.set(invite.code, invite.uses)
      }
    })
  },
}

export default event
