import { CommandInteraction } from "discord.js"
import { APIError, GuildIdNotFoundError } from "../../../../errors"
import config from "../../../../adapters/config"
import { reply } from "../../../../utils/discord"
import { getSuccessEmbed } from "../../../../ui/discord/embed"

export default async function run(i: CommandInteraction) {
  if (!i.guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }
  const value = i.options.getNumber("value", true)

  const { ok, curl, log } = await config.setTipRangeConfig({
    guildId: i.guildId,
    min: value,
  })
  if (!ok) throw new APIError({ msgOrInteraction: i, curl, description: log })
  const embed = getSuccessEmbed({
    title: "You have set up successfully",
    description: `Changed the minrain to: $${value}`,
    originalMsgAuthor: i.user,
  })
  await reply(i, { messageOptions: { embeds: [embed] } })
}
