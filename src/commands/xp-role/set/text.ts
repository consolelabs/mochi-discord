import { GuildIdNotFoundError, InternalError } from "errors"
import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { getEmoji } from "utils/common"
import { PREFIX, XP_ROLE_GITBOOK } from "utils/constants"
import { isInvalidAmount, setConfigXPRole } from "./processor"

const command: Command = {
  id: "xprole_set",
  command: "set",
  brief: "Set a role that users will get when they earn certain amount of XP.",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({})
    }
    const args = getCommandArguments(msg)
    const [, roleArg, amountArg] = args.slice(1)
    const { isRole, value: roleId } = parseDiscordToken(roleArg)
    const invalidRoleDescription = `
    Your role is invalid. Make sure that role exists or that you have entered it correctly.
    ${getEmoji("ANIMATED_POINTING_RIGHT", true)} Type @ to see a role list.
    ${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.
    `
    if (!isRole) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Invalid roles",
        description: invalidRoleDescription,
      })
    }
    const role = await msg.guild.roles.fetch(roleId)
    if (!role) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Invalid roles",
        description: invalidRoleDescription,
      })
    }

    const amount = +amountArg
    if (isInvalidAmount(amount)) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Command Error",
        description:
          "The XP amount is invalid. Please insert a natural number.",
      })
    }

    return await setConfigXPRole(
      msg,
      msg.author,
      role,
      msg.guildId ?? "",
      amount
    )
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}xr set <role> <amount>\n${PREFIX}xprole set <role> <amount>`,
        examples: `${PREFIX}xr set @Mochi 1\n${PREFIX}xr set @SeniorMochian 100`,
        document: `${XP_ROLE_GITBOOK}&action=set`,
      }),
    ],
  }),
  aliases: ["tr"],
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 3,
}

export default command
