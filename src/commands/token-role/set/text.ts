import { GuildIdNotFoundError, InternalError } from "errors"
import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { getEmoji } from "utils/common"
import { PREFIX, TOKEN_ROLE_GITBOOK } from "utils/constants"
import { setConfigTokenRole } from "./processor"

const command: Command = {
  id: "tokenrole_set",
  command: "set",
  brief:
    "Set a role that users will get when they own a specific amount of token.",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({})
    }
    const args = getCommandArguments(msg)
    const [, roleArg, amountArg, addressArg, chain] = args.slice(1)
    const { isRole, value: roleId } = parseDiscordToken(roleArg)
    const invalidRoleDescription = `
    Your role is invalid. Make sure that role exists or that you have entered it correctly.
    ${getEmoji("POINTINGRIGHT")} Type @ to see a role list.
    ${getEmoji(
      "POINTINGRIGHT"
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
    if (Number.isNaN(amount) || amount < 0 || amount >= Infinity) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Command Error",
        description: "The amount is invalid. Please insert a natural number.",
      })
    }

    const { isAddress, value: address } = parseDiscordToken(addressArg)
    if (!isAddress) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Invalid Token address",
        description:
          "We cannot find your token address! Please enter a valid one!",
      })
    }

    return await setConfigTokenRole(
      msg,
      msg.author,
      role,
      msg.guildId ?? "",
      address,
      chain,
      amount
    )
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tr set <role> <amount> <address> <chain_name>\n${PREFIX}tokenrole set <role> <amount> <address> <chain_name>`,
        examples: `${PREFIX}tr set @Mochi 1 0x4E15361FD6b4BB609Fa63C81A2be19d873717870 eth\n${PREFIX}tr set @SeniorMochian 100 0x4E15361FD6b4BB609Fa63C81A2be19d873717870 eth`,
        document: `${TOKEN_ROLE_GITBOOK}&action=set`,
      }),
    ],
  }),
  aliases: ["tr"],
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 5,
}

export default command
