import profile from "../adapters/profile"
import { APIError } from "../errors"
import { equalIgnoreCase } from "./common"

export async function getProfileIdByDiscord(discordId: string) {
  const pf = await profile.getByDiscord(discordId)
  if (pf.err) {
    throw new APIError({
      description: `[getProfileIdByDiscord] API error with status ${pf.status_code}`,
      curl: "",
      status: pf.status ?? 500,
      error: pf.error,
    })
  }
  return pf.id
}
export async function getDiscordRenderableByProfileId(profileId: string) {
  const pf = await profile.getById(profileId)
  if (pf.err) {
    throw new APIError({
      description: `[getDiscordRenderableByProfileId] API error with status ${pf.status_code}`,
      curl: "",
      status: pf.status ?? 500,
      error: pf.error,
    })
  }

  // handle case app profile
  if (pf.type === "application") {
    return `\`${pf.application?.name ?? "Unknown Application"}\``
  }

  // case user profile
  const discord = pf.associated_accounts.find((aa: any) =>
    equalIgnoreCase(aa.platform, "discord"),
  )

  if (!discord) return pf.profile_name

  return `<@${discord.platform_identifier}>`
}
