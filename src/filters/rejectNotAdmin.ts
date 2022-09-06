import { GuildMember } from "discord.js"
import { MochiFilter } from "types/common"
import { hasAdministrator } from "utils/common"

/*
 * Exit silently if the caller is not admin
 * */
const rejectNotAdmin: MochiFilter = async (i) => {
  if (!i.member || hasAdministrator(i.member as GuildMember))
    return Promise.reject()
  return Promise.resolve()
}

export default rejectNotAdmin
