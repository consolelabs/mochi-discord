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
  const value = i.options.getNumber("value", true)

  // validation
  if (value < 0) {
    throw new CommandArgumentError({
      message: i,
      getHelpMessage: async () => ({
        embeds: [
          getErrorEmbed({
            title: "Set up minrain failed",
            description: "Value must not be a negative number",
          }),
        ],
      }),
    })
  }

  const { data: tipRange } = await config.getTipRangeConfig(i.guildId)
  const { max } = tipRange ?? {}
  if (max && value >= max) {
    throw new CommandArgumentError({
      message: i,
      getHelpMessage: async () => ({
        embeds: [
          getErrorEmbed({
            title: "Set up minrain failed",
            description: `Your current maxtipped is $${max}. Minrain must be smaller than maxtipped`,
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
    error,
  } = await config.setTipRangeConfig({
    guildId: i.guildId,
    min: value,
  })
  if (!ok)
    throw new APIError({
      msgOrInteraction: i,
      curl,
      description: log,
      status,
      error,
    })
  const embed = getSuccessEmbed({
    title: "You have set up successfully",
    description: `Changed the minrain to: $${value}`,
    originalMsgAuthor: i.user,
  })
  await reply(i, { messageOptions: { embeds: [embed] } })
}
