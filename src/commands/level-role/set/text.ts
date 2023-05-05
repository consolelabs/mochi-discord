import config from "adapters/config"
import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { getEmoji } from "utils/common"
import { LEVEL_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { APIError } from "errors"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import profile from "adapters/profile"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_LEVELROLE,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { sendActivityMsg, defaultActivityMsg } from "utils/activity"

const command: Command = {
  id: "lr_set",
  command: "set",
  brief: "Level Role Configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guildId || !msg.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const args = getCommandArguments(msg)
    const [roleArg, levelArg] = args.slice(2)
    if (!roleArg.startsWith("<@&") || !roleArg.endsWith(">")) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: "Invalid role format",
              description: `Your role is in an invalid format. Make sure an “@” symbol is put before the role.\n\n${getEmoji(
                "ANIMATED_POINTING_RIGHT",
                true
              )} Type @ to see a role list.\n${getEmoji(
                "ANIMATED_POINTING_RIGHT",
                true
              )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.`,
            }),
          ],
        },
      }
    }

    const roleId = roleArg.substring(3, roleArg.length - 1)
    const role = await msg.guild.roles.fetch(roleId)
    if (!role) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Role not found" })],
        },
      }
    }

    const level = +levelArg
    if (Number.isNaN(level) || level <= 0 || level >= Infinity)
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Invalid level" })],
        },
      }

    const res = await config.configLevelRole({
      guild_id: msg.guildId,
      role_id: role.id,
      level,
    })
    if (res.ok) {
      // send activity
      const dataProfile = await profile.getByDiscord(msg.author.id)
      if (dataProfile.err) {
        throw new APIError({
          msgOrInteraction: msg,
          description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
          curl: "",
        })
      }
      const kafkaMsg: KafkaQueueActivityDataCommand = defaultActivityMsg(
        dataProfile.id,
        MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
        MOCHI_APP_SERVICE,
        MOCHI_ACTION_LEVELROLE
      )
      kafkaMsg.activity.content.role_name = role.name
      sendActivityMsg(kafkaMsg)
      return {
        messageOptions: {
          embeds: [
            getSuccessEmbed({
              msg,
              description: `Successfully configured role <@&${role.id}> for level ${level}`,
            }),
          ],
        },
      }
    }
    let description = res.error
    let title
    if (description.toLowerCase().includes("role has been used")) {
      description = `Your role has been used for an existing NFT role. Please choose another one.\n\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} Type @ to see a role list.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.`
      title = "Invalid roles"
    }
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ msg, description, title })],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}lr set <role> <level>\n`,
        examples: `${PREFIX}levelrole set @Mochi 1\n${PREFIX}lr set @admin 2`,
        description: "Assign a role to users when they reach a certain level",
        document: LEVEL_ROLE_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["lr"],
  colorType: "Server",
  minArguments: 4,
}

export default command
