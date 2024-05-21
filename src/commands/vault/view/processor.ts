import { faker } from "@faker-js/faker"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, msgColors } from "utils/common"
import { buildTreasurerFields } from "../info/processor"

export async function run({
  i,
  guildId,
}: {
  i: CommandInteraction
  guildId?: string | null
}) {
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
