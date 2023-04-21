import { CommandInteraction } from "discord.js"
import { APIError, GuildIdNotFoundError } from "../../../../errors"
import config from "../../../../adapters/config"
import { reply } from "../../../../utils/discord"
import { getSuccessEmbed } from "../../../../ui/discord/embed"

export default async function run(i: CommandInteraction) {
  if (!i.guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }
  const min = i.options.getNumber("minrain", true)
  const max = i.options.getNumber("maxtipped", true)

  const { ok, curl, log } = await config.setTipRangeConfig({
    guildId: i.guildId,
    min,
    max,
  })
  if (!ok) throw new APIError({ msgOrInteraction: i, curl, description: log })
  const embed = getSuccessEmbed({
    title: "The tip range was successfully set",
    description: `You've configured the tip range to:`,
    originalMsgAuthor: i.user,
  }).addFields(
    { name: "Minrain", value: `$${min}`, inline: true },
    { name: "Maxtipped", value: `$${max}`, inline: true }
  )
  await reply(i, { messageOptions: { embeds: [embed] } })
}
