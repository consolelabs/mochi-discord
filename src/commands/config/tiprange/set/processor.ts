import { CommandInteraction } from "discord.js"
import {
  APIError,
  CommandArgumentError,
  GuildIdNotFoundError,
} from "../../../../errors"
import config from "../../../../adapters/config"
import { reply } from "../../../../utils/discord"
import { getErrorEmbed, getSuccessEmbed } from "../../../../ui/discord/embed"

export default async function run(i: CommandInteraction) {
  if (!i.guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }
  const min = i.options.getNumber("minrain", true)
  const max = i.options.getNumber("maxtipped", true)

  // validation
  if (min < 0 || max < 0) {
    throw new CommandArgumentError({
      message: i,
      getHelpMessage: async () => ({
        embeds: [
          getErrorEmbed({
            title: "Set up tip range failed",
            description: "Minrain and maxtipped must not be a negative number",
          }),
        ],
      }),
    })
  }
  if (min >= max) {
    throw new CommandArgumentError({
      message: i,
      getHelpMessage: async () => ({
        embeds: [
          getErrorEmbed({
            title: "Set up tip range failed",
            description: "Minrain must be smaller than maxtipped",
          }),
        ],
      }),
    })
  }

  const {
    ok,
    curl,
    log,
    status = 500,
  } = await config.setTipRangeConfig({
    guildId: i.guildId,
    min,
    max,
  })
  if (!ok)
    throw new APIError({ msgOrInteraction: i, curl, description: log, status })
  const embed = getSuccessEmbed({
    title: "The tip range was successfully set",
    description: `You've configured the tip range to:`,
    originalMsgAuthor: i.user,
  }).addFields(
    { name: "Minrain", value: `$${min}`, inline: true },
    { name: "Maxtipped", value: `$${max}`, inline: true },
  )
  await reply(i, { messageOptions: { embeds: [embed] } })
}
