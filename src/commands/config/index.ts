import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
// logchannel
import logChannelSetSlash from "./logchannel/set/slash"
import logChannelInfoSlash from "./logchannel/info/slash"
// currency
import currencyInfoSlash from "./currency/info/slash"
import currencySetSlash from "./currency/set/slash"
import currencyRemoveSlash from "./currency/remove/slash"

// tiprange
import tiprangeInfoSlash from "./tiprange/info/slash"
import tiprangeSetSlash from "./tiprange/set/slash"
import tiprangeRemoveSlash from "./tiprange/remove/slash"

import minrainSlash from "./minrain/index/slash"
import maxtippedSlash from "./maxtipped/index/slash"
// moniker
import monikerInfoSlash from "./moniker/info/slash"
import monikerListSlash from "./moniker/list/slash"
import monikerSetSlash from "./moniker/set/slash"
import monikerRemoveSlash from "./moniker/remove/slash"
// welcome
import welcomeInfoSlash from "./welcome/info/slash"
import welcomeSetSlash from "./welcome/set/slash"
import welcomeRemoveSlash from "./welcome/remove/slash"
// captcha
import verifyInfoSlash from "./verify/info/slash"
import verifyCaptchaSlash from "./verify/captcha/slash"
import verifySetSlash from "./verify/set/slash"
import verifyRemoveSlash from "./verify/remove/slash"

const subCommandGroups: Record<string, Record<string, SlashCommand>> = {
  logchannel: {
    set: logChannelSetSlash,
    info: logChannelInfoSlash,
  },
  moniker: {
    info: monikerInfoSlash,
    list: monikerListSlash,
    set: monikerSetSlash,
    remove: monikerRemoveSlash,
  },
  welcome: {
    info: welcomeInfoSlash,
    set: welcomeSetSlash,
    remove: welcomeRemoveSlash,
  },
  verify: {
    info: verifyInfoSlash,
    set: verifySetSlash,
    remove: verifyRemoveSlash,
    // captcha: verifyCaptchaSlash,
  },
  currency: {
    info: currencyInfoSlash,
    set: currencySetSlash,
    remove: currencyRemoveSlash,
  },
  tiprange: {
    info: tiprangeInfoSlash,
    set: tiprangeSetSlash,
    remove: tiprangeRemoveSlash,
  },
}

const subCommands: Record<string, SlashCommand> = {
  minrain: minrainSlash,
  maxtipped: maxtippedSlash,
}
const slashCmd: SlashCommand = {
  name: "config",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("config")
      .setDescription("Config various aspects of the server")

    // logchannel
    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("logchannel")
        .setDescription(
          "Keep all records of every user's activity and interaction",
        )
        .addSubcommand(
          <SlashCommandSubcommandBuilder>logChannelSetSlash.prepare(),
        )
        .addSubcommand(
          <SlashCommandSubcommandBuilder>logChannelInfoSlash.prepare(),
        ),
    )

    // moniker
    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("moniker")
        .setDescription("Moniker configuration")
        .addSubcommand(
          <SlashCommandSubcommandBuilder>monikerInfoSlash.prepare(),
        )
        .addSubcommand(
          <SlashCommandSubcommandBuilder>monikerListSlash.prepare(),
        )
        .addSubcommand(<SlashCommandSubcommandBuilder>monikerSetSlash.prepare())
        .addSubcommand(
          <SlashCommandSubcommandBuilder>monikerRemoveSlash.prepare(),
        ),
    )

    // welcome message
    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("welcome")
        .setDescription("Welcome new members to the guild")
        .addSubcommand(
          <SlashCommandSubcommandBuilder>welcomeInfoSlash.prepare(),
        )
        .addSubcommand(<SlashCommandSubcommandBuilder>welcomeSetSlash.prepare())
        .addSubcommand(
          <SlashCommandSubcommandBuilder>welcomeRemoveSlash.prepare(),
        ),
    )

    // verify
    data.addSubcommandGroup(
      (subcommandGroup) =>
        subcommandGroup
          .setName("verify")
          .setDescription("Verify wallet")
          .addSubcommand(
            <SlashCommandSubcommandBuilder>verifyInfoSlash.prepare(),
          )
          .addSubcommand(
            <SlashCommandSubcommandBuilder>verifySetSlash.prepare(),
          )
          .addSubcommand(
            <SlashCommandSubcommandBuilder>verifyRemoveSlash.prepare(),
          ),
      // .addSubcommand(
      //   <SlashCommandSubcommandBuilder>verifyCaptchaSlash.prepare(),
      // ),
    )

    // currency
    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("currency")
        .setDescription("Config default currency for this server")
        .addSubcommand(
          <SlashCommandSubcommandBuilder>currencyInfoSlash.prepare(),
        )
        .addSubcommand(
          <SlashCommandSubcommandBuilder>currencySetSlash.prepare(),
        )
        .addSubcommand(
          <SlashCommandSubcommandBuilder>currencyRemoveSlash.prepare(),
        ),
    )

    // tip range
    data.addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("tiprange")
        .setDescription("Config tiprange for this server")
        .addSubcommand(
          <SlashCommandSubcommandBuilder>tiprangeInfoSlash.prepare(),
        )
        .addSubcommand(
          <SlashCommandSubcommandBuilder>tiprangeSetSlash.prepare(),
        )
        .addSubcommand(
          <SlashCommandSubcommandBuilder>tiprangeRemoveSlash.prepare(),
        ),
    )

    // data.addSubcommand(<SlashCommandSubcommandBuilder>currencySlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>minrainSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>maxtippedSlash.prepare())
    return data
  },
  run: async function (i) {
    const subCommandGroup = i.options.getSubcommandGroup(false)
    const subCommand = i.options.getSubcommand(true)

    if (!subCommandGroup && subCommand) {
      return subCommands[subCommand].run(i)
    }

    return subCommandGroups[i.options.getSubcommandGroup(true)][
      i.options.getSubcommand(true)
    ].run(i)
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default { slashCmd }
