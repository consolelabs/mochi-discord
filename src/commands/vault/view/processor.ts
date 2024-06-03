import { faker } from "@faker-js/faker"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, msgColors } from "utils/common"
import { buildTreasurerFields } from "../info/processor"
import mochiPay from "adapters/mochi-pay"
import { getDiscordIdByProfileId, getProfileIdByDiscord } from "utils/profile"

export async function run({
  i,
  guildId,
  vaultId,
  vaultType,
}: {
  i: CommandInteraction
  guildId?: string | null
  vaultId: string
  vaultType: string
}) {
  if (vaultType === "trading") {
    const profileId = await getProfileIdByDiscord(i.user.id)
    const data = await mochiPay.getEarningVaultConfigs(profileId, vaultId)
    const { name, api_key, secret_key, thresh_hold } = data
    const basicInfo = [
      `${getEmoji("ANIMATED_VAULT", true)}\`Name.        ${name}\``,
      `${getEmoji("ANIMATED_VAULT_KEY")}\`API Key.    \` ${api_key}`,
      `${getEmoji("ANIMATED_VAULT_KEY")}\`Secret Key. \` ${secret_key}`,
      `${getEmoji("APPROVE")}\`Threshold.  \` ${thresh_hold}%`,
      // `${getEmoji("NEWS")}\`Channel. \` <#1019524376527372288>`,
    ].join("\n")

    const treasurers = await Promise.all(
      data.treasurers.map(async (t: any) => {
        const discordId = await getDiscordIdByProfileId(t.profile_id)
        return { user_discord_id: discordId, role: t.role }
      }),
    )

    const treasurersFields = buildTreasurerFields({ treasurer: treasurers })
    const embed = composeEmbedMessage(null, {
      title: `${getEmoji("ANIMATED_DIAMOND")} Vault config`,
      description: basicInfo,
      color: msgColors.BLUE,
    }).addFields(treasurersFields)

    return { messageOptions: { embeds: [embed] } }
  }
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }

  const apiKey = faker.git.commitSha()
  const secretKey = faker.git.commitSha()
  const basicInfo = [
    `${getEmoji("ANIMATED_VAULT", true)}\`Name. podtown\``,
    `${getEmoji("ANIMATED_VAULT_KEY")}\`API Key. \` ${apiKey.slice(
      0,
      5,
    )}...${apiKey.slice(-5)}`,
    `${getEmoji("ANIMATED_VAULT_KEY")}\`Secret Key. \` ${secretKey.slice(
      0,
      5,
    )}...${secretKey.slice(-5)}`,
    `${getEmoji("APPROVE")}\`Threshold. \` 50%`,
    `${getEmoji("NEWS")}\`Channel. \` <#1019524376527372288>`,
  ].join("\n")

  const treasurers = buildTreasurerFields({
    treasurer: [
      { user_discord_id: "463379262620041226", role: "creator" },
      { user_discord_id: "151497832853929986", role: "" },
    ],
  })

  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("ANIMATED_DIAMOND")} Vault config`,
    description: basicInfo,
    color: msgColors.BLUE,
  }).addFields(treasurers)

  return { messageOptions: { embeds: [embed] } }
}
