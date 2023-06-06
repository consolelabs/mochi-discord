import profile from "../adapters/profile"
import { APIError } from "../errors"

export async function getProfileIdByDiscord(
  discordId: string,
  noFetchAmount = false
) {
  const pf = await profile.getByDiscord(discordId, noFetchAmount)
  if (pf.err) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${pf.status_code}`,
      curl: "",
    })
  }
  return pf.id
}
