import {
  CommandInteraction,
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { InternalError } from "errors"
import { MachineConfig, route } from "utils/router"
import {
  render,
  sendBinanceManualMessage,
  showModalBinanceKeys,
  submitBinanceKeys,
  Target,
} from "./processor"
import { machineConfig as watchListMachineConfig } from "commands/watchlist/view/slash"
import { machineConfig as qrCodeMachineConfig } from "commands/qr/index/slash"
import { machineConfig as earnMachineConfig } from "commands/earn/index"
import { machineConfig as balanceMachineConfig } from "commands/balances/index/slash"
import { handleWalletAddition } from "commands/wallet/add/processor"
import { runGetVaultDetail } from "commands/vault/info/processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmojiURL } from "utils/common"

import profile from "adapters/profile"
import { getProfileIdByDiscord } from "utils/profile"
import {
  HOMEPAGE_URL,
  MOCHI_PROFILE_API_BASE_URL_PUBLIC,
} from "utils/constants"

const machineConfig: (target: Target) => MachineConfig = (target) => ({
  id: "profile",
  initial: "profile",
  context: {
    button: {
      profile: async (i) => ({ msgOpts: await render(i, target) }),
      addWallet: (i) => handleWalletAddition(i),
    },
    select: {
      vault: async (i) => await runGetVaultDetail(i.values[0].split("_")[1], i),
    },
    // indicates this action to result in ephemeral response
    ephemeral: {
      CONNECT_BINANCE: true,
      CONNECT_SUI: true,
      CONNECT_RON: true,
      CONNECT_GITHUB: true,
    },
  },
  states: {
    profile: {
      on: {
        VIEW_WATCHLIST: "watchlist",
        VIEW_WALLET_VAULT: [
          {
            target: "vault",
            cond: "isVault",
          },
          {
            target: "wallet",
            cond: "isWallet",
          },
        ],
        VIEW_QUESTS: "earn",
        VIEW_ADD_WALLET: "addWallet",
        VIEW_QR_CODES: "qrCodes",
        CONNECT_BINANCE: {
          target: "profile",
          actions: {
            type: "showBinanceManualMessage",
          },
        },
        CONNECT_SUI: {
          target: "profile",
          actions: {
            type: "showVerifyMessage",
          },
        },
        CONNECT_RON: {
          target: "profile",
          actions: {
            type: "showVerifyMessage",
          },
        },
        CONNECT_GITHUB: {
          target: "profile",
          actions: {
            type: "showAssocSocialMessage",
          },
        },
      },
    },
    qrCodes: {
      on: {
        BACK: "profile",
      },
      ...qrCodeMachineConfig(),
    },
    addWallet: {
      on: {
        BACK: "profile",
      },
    },
    watchlist: {
      on: {
        BACK: "profile",
      },
      ...watchListMachineConfig(),
    },
    wallet: {
      on: {
        BACK: "profile",
      },
      ...balanceMachineConfig({}, target.id),
    },
    vault: {
      on: {
        BACK: "profile",
      },
    },
    earn: {
      on: {
        BACK: "profile",
      },
      ...earnMachineConfig,
    },
  },
})

const run = async (interaction: CommandInteraction) => {
  let member = interaction.options.getMember("user") as GuildMember
  if (member !== null && member.user.bot) {
    throw new InternalError({
      msgOrInteraction: interaction,
      title: "Error",
      description: "Cannot view profile of bots",
    })
  }
  const target: Target = {
    username: "",
    name: "",
    avatar: "",
    id: "",
  }
  if (interaction.channel?.type === "DM") {
    target.id = interaction.user.id
    target.avatar = interaction.user.displayAvatarURL()
    target.name = interaction.user.username
    target.username = interaction.user.username
  } else {
    member = member ?? (interaction.member as GuildMember)

    target.id = member.user.id
    target.avatar = member.displayAvatarURL()
    target.username = member.user.username
    target.name = member.nickname || member.displayName || target.username
    target.roles = member.roles
  }
  const msgOpts = await render(interaction, target)
  const reply = (await interaction.editReply(msgOpts)) as Message

  route(reply, interaction, machineConfig(target), {
    actions: {
      showVerifyMessage: async (_, event) => {
        if (
          !event.interaction ||
          !event.interaction.isButton() ||
          !event.interaction.customId.startsWith("connect")
        )
          return

        let emojiURL = getEmojiURL(emojis.WALLET_1)
        let title = "Connect your"
        if (event.type === "CONNECT_RON") {
          emojiURL = getEmojiURL(emojis.RON)
          title += "Ronin wallet"
        } else {
          emojiURL = getEmojiURL(emojis.SUI)
          title += "Sui wallet"
        }

        const embed = composeEmbedMessage(null, {
          author: [title, emojiURL],
          description:
            "Please verify your wallet address by clicking the button below.",
        })
        // request profile code
        const profileId = await getProfileIdByDiscord(event.interaction.user.id)
        const { data, ok } = await profile.requestProfileCode(profileId)

        if (!ok) {
          throw new InternalError({
            reason: "Couldn't get profile id",
            descriptions: ["Something went wrong"],
          })
        }

        await event.interaction.editReply({
          embeds: [embed],
          components: [
            new MessageActionRow().addComponents(
              new MessageButton()
                .setLabel("Verify")
                .setStyle("LINK")
                .setURL(
                  `${HOMEPAGE_URL}/verify?code=${data.code}&guild_id=${event.interaction.guildId}`,
                ),
            ),
          ],
        })
      },
      showAssocSocialMessage: async (_, event) => {
        if (
          !event.interaction ||
          !event.interaction.isButton() ||
          !event.interaction.customId.startsWith("connect")
        )
          return

        let emojiURL = getEmojiURL(emojis.WALLET_1)
        let title = "Connect your"
        if (event.type === "CONNECT_GITHUB") {
          emojiURL = getEmojiURL(emojis.GITHUB)
          title += "Github account"
        }

        const embed = composeEmbedMessage(null, {
          author: [title, emojiURL],
          description:
            "Please verify your github account by clicking the button below.",
        })
        // request profile code
        const profileId = await getProfileIdByDiscord(event.interaction.user.id)
        const { data, ok } = await profile.requestProfileCode(profileId)

        if (!ok) {
          throw new InternalError({
            reason: "Couldn't get profile id",
            descriptions: ["Something went wrong"],
          })
        }

        await event.interaction.editReply({
          embeds: [embed],
          components: [
            new MessageActionRow().addComponents(
              new MessageButton()
                .setLabel("Verify")
                .setStyle("LINK")
                .setURL(
                  `${MOCHI_PROFILE_API_BASE_URL_PUBLIC}/profiles/me/accounts/connect-github?platform=discord&channel_id=${interaction.channelId}&application=mochi&code=${data.code}&guild_id=${interaction.guildId}&author_id=${interaction.user.id}`,
                ),
            ),
          ],
        })
      },
      showBinanceManualMessage: async (_, event) => {
        if (
          !event.interaction ||
          !event.interaction.isButton() ||
          event.interaction.customId !== "connect_binance"
        )
          return

        const result = sendBinanceManualMessage()

        const reply = (await event.interaction.editReply(
          result.msgOpts,
        )) as Message

        route(reply, event.interaction, {
          id: "binance",
          initial: "binance",
          context: {
            ephemeral: {
              ENTER_KEY: true,
            },
            modal: {
              ENTER_KEY: true,
            },
            button: {
              binance: async (i) =>
                submitBinanceKeys(i, await showModalBinanceKeys(i)),
            },
          },
          states: {
            binance: {
              on: {
                ENTER_KEY: "binance",
              },
            },
          },
        })
      },
    },
    guards: {
      isWallet: (_ctx, ev) => {
        return ev.interaction?.values[0].startsWith("wallet")
      },
      isVault: (_ctx, ev) => {
        return ev.interaction?.values[0].startsWith("vault")
      },
    },
  })
}
export default run
