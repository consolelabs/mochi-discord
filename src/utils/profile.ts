import profile from "../adapters/profile"
import { APIError } from "../errors"

export async function getProfileIdByDiscord(discordId: string) {
  const pf = await profile.getByDiscord(discordId)
  if (pf.err) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${pf.status_code}`,
      curl: "",
    })
  }
  return pf.id
}
