import config from "adapters/config"
import Config from "adapters/config"
import {
  CommandInteraction,
  Message,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { APIError } from "errors"
import { InteractionHandler } from "handlers/discord/select-menu"
import { ModelGuildConfigDaoTracker } from "types/api"
import { composeDiscordExitButton } from "ui/discord/button"
import { getErrorEmbed, getSuccessEmbed } from "ui/discord/embed"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeProposalInfoEmbed } from "../info/processor"

export const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const msg = msgOrInteraction as Message
  const [id] = interaction.values[0].split("|")
  await Config.deleteDaoTrackerConfigs({ id })
  const configs = await Config.getGuildNFTRoleConfigs(
    msgOrInteraction.guildId ?? ""
  )
  if (configs.ok) {
    const { description } = await composeProposalInfoEmbed(
      msgOrInteraction.guildId ?? ""
    )
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: `Successfully remove tracker`,
            description: `You can use \`$proposal track\` to set the new proposal tracker.\n\n${description}`,
          }),
        ],
        components: [],
      },
    }
  }
  return {
    messageOptions: { embeds: [getErrorEmbed({})] },
  }
}

export async function handle(msg: Message | CommandInteraction) {
  const { ok, data, log, curl, error } = await config.getDaoTrackerConfigs(
    msg.guildId ?? ""
  )
  if (!ok) {
    throw new APIError({ curl, description: log, error })
  }
  if (data.length === 0 || !ok) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: `${getEmoji("mail")} No tracker found!`,
            description: `You haven't set up any tracker!\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} You can set up your DAO voting channel by \`${PREFIX}proposal track #channel <snapshot_DAO_link>\``,
          }),
        ],
      },
    }
  }
  const options: MessageSelectOptionData[] = []
  data.forEach((config: ModelGuildConfigDaoTracker) => {
    options.push({
      label: config.space?.toUpperCase() ?? "",
      value: `${config.id ?? ""}|${config.space ?? ""}`,
    })
  })
  return {
    messageOptions: {
      embeds: [await composeProposalInfoEmbed(msg.guildId ?? "")],
      components: [
        composeDiscordSelectionRow({
          customId: "proposal_untrack",
          placeholder: "Select a DAO space",
          options,
        }),
        composeDiscordExitButton(
          msg instanceof Message ? msg.author.id : msg.user.id
        ),
      ],
    },
    interactionOptions: {
      handler,
    },
  }
}
