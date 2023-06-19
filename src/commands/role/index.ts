import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { LOG_CHANNEL_GITBOOK, SLASH_PREFIX } from "utils/constants"
import defaultRole from "./default"
import level from "./level"
import mix from "./mix"
import nft from "./nft"
import reaction from "./reaction"
import token from "./token"

// this one to track the subcommand group only admin permission
const subCommandGroups: Record<string, Record<string, SlashCommand>> = {
  default: defaultRole,
  level,
  mix,
  nft,
  reaction,
  token,
}

const slashCmd: SlashCommand = {
  name: "role",
  category: "Config",
  onlyAdministrator: function (i) {
    const onlyAdmin =
      subCommandGroups[i.options.getSubcommandGroup(true)][
        i.options.getSubcommand(true)
      ].onlyAdministrator
    if (typeof onlyAdmin === "function") return onlyAdmin(i)
    return Boolean(onlyAdmin)
  },
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("role")
      .setDescription("Setup role your guild")

    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("default")
        .setDescription("Set default role for your guild")
        .addSubcommand(
          <SlashCommandSubcommandBuilder>defaultRole.info.prepare()
        )
        .addSubcommand(<SlashCommandSubcommandBuilder>defaultRole.set.prepare())
        .addSubcommand(
          <SlashCommandSubcommandBuilder>defaultRole.remove.prepare()
        )
    )

    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("level")
        .setDescription("Set level role for your guild")
        .addSubcommand(<SlashCommandSubcommandBuilder>level.list.prepare())
        .addSubcommand(<SlashCommandSubcommandBuilder>level.set.prepare())
        .addSubcommand(<SlashCommandSubcommandBuilder>level.remove.prepare())
    )

    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("mix")
        .setDescription(
          "Combine different thresholds (XP/level, NFT and Token) to assign a role"
        )
        .addSubcommand(<SlashCommandSubcommandBuilder>mix.list.prepare())
        .addSubcommand(<SlashCommandSubcommandBuilder>mix.set.prepare())
        .addSubcommand(<SlashCommandSubcommandBuilder>mix.remove.prepare())
    )

    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("nft")
        .setDescription(
          "Asssign role to a user once they hold a certain amount of NFT"
        )
        .addSubcommand(<SlashCommandSubcommandBuilder>nft.list.prepare())
        .addSubcommand(<SlashCommandSubcommandBuilder>nft.set.prepare())
        .addSubcommand(<SlashCommandSubcommandBuilder>nft.remove.prepare())
    )

    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("reaction")
        .setDescription("Assign a role corresponding to users' reaction")
        .addSubcommand(<SlashCommandSubcommandBuilder>reaction.list.prepare())
        .addSubcommand(<SlashCommandSubcommandBuilder>reaction.set.prepare())
        .addSubcommand(<SlashCommandSubcommandBuilder>reaction.remove.prepare())
    )

    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("token")
        .setDescription(
          "Assign role to a user once they hold a certain amount of Token"
        )
        .addSubcommand(<SlashCommandSubcommandBuilder>token.list.prepare())
        .addSubcommand(<SlashCommandSubcommandBuilder>token.set.prepare())
        .addSubcommand(<SlashCommandSubcommandBuilder>token.remove.prepare())
    )

    return data
  },
  run: function (i) {
    return subCommandGroups[i.options.getSubcommandGroup(true)][
      i.options.getSubcommand(true)
    ].run(i)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        includeCommandsList: true,
        usage: `${SLASH_PREFIX}role <action>`,
        description: "Setup role aspect for your guild",
        footer: [
          `Type ${SLASH_PREFIX}help role <action> for a specific action!`,
        ],
        document: LOG_CHANNEL_GITBOOK,
        title: "Default",
        examples: `${SLASH_PREFIX}role token info`,
      }),
    ],
  }),
  colorType: "Server",
}

export default { slashCmd }
