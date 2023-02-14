import community from "adapters/community"
import config from "adapters/config"
import defi from "adapters/defi"
import {
  Message,
  AwaitMessagesOptions,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import {
  APIError,
  GuildIdNotFoundError,
  InternalError,
  OriginalMessage,
} from "errors"
import { getExitButton } from "ui/discord/button"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import { defaultEmojis, getEmoji } from "utils/common"

export async function process(message: OriginalMessage) {
  if (!message.guildId || !message.guild) {
    throw new GuildIdNotFoundError({})
  }

  const isTextCommand = message instanceof Message
  const userId = isTextCommand ? message.author.id : message.user.id
  const send = async ({
    embeds,
    components,
  }: {
    embeds: [MessageEmbed]
    components?: [MessageActionRow]
  }) => {
    if (isTextCommand) {
      await message.reply({ embeds, components })
    } else {
      await message.followUp({ embeds, components })
    }
  }

  const options: AwaitMessagesOptions = {
    filter: (response) => response.author.id === userId,
    max: 1,
    time: 30_000,
    errors: ["time"],
  }

  const collectRole = async () => {
    const title = `${getEmoji(
      "mag"
    )} Please enter the role you want to assign by level, amount of NFT, and token.`
    const embed = composeEmbedMessage(null, { title })
    await send({ embeds: [embed] })
    const collected = await message.channel?.awaitMessages(options)
    const roleArg = collected?.first()?.content?.trim() ?? ""
    const { isRole, value: roleId } = parseDiscordToken(roleArg)
    if (!isRole) {
      const description = `
      Your role is invalid. Make sure that role exists, or that you have entered it correctly.\n
      ${getEmoji("pointingright")} Type @ to see a role list.
      ${getEmoji(
        "pointingright"
      )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.`
      throw new InternalError({
        message: message,
        title: "Invalid role",
        description,
      })
    }
    return roleId
  }

  const collectLevel = async (roleName: string) => {
    const title = `${getEmoji(
      "mag"
    )} Please enter the minimum level that will be required to earn the role ${roleName}`
    const description = `
    ${getEmoji("pointingright")} Usage: <level>
    ${getEmoji("pointingright")} Eg: 5\n
    ***If you don’t want to skip setting up this condition, you can type 0 or No.***`
    const embed = composeEmbedMessage(null, {
      title,
      description,
    })
    await send({ embeds: [embed] })
    const collected = await message.channel?.awaitMessages(options)
    const levelArg = collected?.first()?.content?.trim() ?? ""
    if (levelArg === "0" || levelArg?.toLocaleLowerCase() === "no") {
      return 0
    }
    const level = +levelArg
    if (isInvalidAmount(level)) {
      throw new InternalError({
        message: message,
        title: "Command error",
        description: "The level is invalid. Please insert a natural number.",
      })
    }
    return level
  }

  const collectNft = async (roleName: string) => {
    const title = `${getEmoji(
      "mag"
    )} Please enter the minimum amount of NFT and the NFT address that will be required to earn the role ${roleName}.`
    const description = `
    ${getEmoji("pointingright")} Usage: <amount> <NFT address>
    ${getEmoji("pointingright")} Eg: 1 0x7a…E73\n
    ***If you don’t want to skip setting up this condition, you can type 0 or No.***`
    const embed = composeEmbedMessage(null, {
      title,
      description,
    })
    await send({ embeds: [embed] })
    const collected = await message.channel?.awaitMessages(options)
    const nftArgs = collected?.first()?.content?.trim() ?? ""
    if (nftArgs === "0" || nftArgs?.toLocaleLowerCase() === "no") {
      return
    }
    const [amountArg, address] = nftArgs.split(" ")
    const amount = +amountArg
    if (isInvalidAmount(amount)) {
      collected?.first()?.reply("Hello")
      throw new InternalError({
        message: message,
        title: "Invalid amount",
        description: "Invalid amount desc",
      })
    }
    if (!address) {
      throw new InternalError({
        message: message,
        title: "Invalid Token address",
        description:
          "We cannot find your token address! Please enter a valid one!",
      })
    }
    const { ok, data, error, curl, log } =
      await community.getNFTCollectionDetail({
        collectionAddress: address,
        queryAddress: true,
      })
    if (error?.toLocaleLowerCase().startsWith("record not found")) {
      throw new InternalError({
        message: message,
        title: "Command Error",
        description:
          "The collection has not supported yet. Please contact us to support!",
      })
    }
    if (!ok) {
      throw new APIError({
        message: message,
        error,
        description: log,
        curl,
      })
    }
    return { amount, nft_id: data.id, symbol: data.symbol }
  }

  const collectToken = async (roleName: string) => {
    const title = `${getEmoji(
      "mag"
    )} Please enter the minimum amount of token and the token address that will be required to earn the role ${roleName}`
    const description = `
    ${getEmoji("pointingright")} Usage: <amount> <token_address> <chain>
    ${getEmoji("pointingright")} Eg: 1 0x2…C83 eth\n
    ***If you don’t want to skip setting up this condition, you can type 0 or No.***`
    const embed = composeEmbedMessage(null, {
      title,
      description,
    })
    await send({ embeds: [embed] })
    const collected = await message.channel?.awaitMessages(options)
    const tokenArgs = collected?.first()?.content.trim() ?? ""
    if (tokenArgs === "0" || tokenArgs?.toLocaleLowerCase() === "no") {
      return
    }
    const [amountArg, address, chain] = tokenArgs.split(" ")
    const amount = +amountArg
    if (isInvalidAmount(amount)) {
      throw new InternalError({
        message: message,
        title: "Command error",
        description: "The amount is invalid. Please insert a natural number.",
      })
    }
    if (!address) {
      throw new InternalError({
        message: message,
        title: "Invalid Token address",
        description:
          "We cannot find your token address! Please enter a valid one!",
      })
    }
    if (!chain) {
      throw new InternalError({
        message: message,
        title: "Invalid chain",
        description: "We cannot find your chain! Please enter a valid one!",
      })
    }
    const { ok, data, curl, log, error } = await defi.getSupportedToken({
      address,
      chain,
    })
    if (!ok) {
      throw new APIError({
        message: message,
        error,
        curl,
        description: log,
      })
    }
    return { amount, token_id: data.id ?? 0, symbol: data.symbol ?? "" }
  }

  const submitConfig = async ({
    guild_id,
    role_id,
    role_name,
    required_level,
    token_requirement,
    nft_requirement,
  }: {
    guild_id: string
    role_id: string
    role_name: string
    required_level: number
    token_requirement?: {
      symbol: string
      amount: number
      token_id: number
    }
    nft_requirement?: {
      symbol: string
      amount: number
      nft_id: string
    }
  }) => {
    if (!required_level && !token_requirement && !nft_requirement) {
      throw new InternalError({
        message: message,
        title: "Fail to set up mixed role!",
        description: `
        No condition was set! We can’t set the mixed role for ${role_name}.
        You should set at least 1 condition. Try running \`$mixedrole set\` again`,
      })
    }
    const customId = `mix_config_btn_confirmation-${role_id}`
    const confirmButton = new MessageButton({
      label: "Confirm",
      emoji: getEmoji("approve"),
      customId: customId,
      style: "PRIMARY",
    })
    const revokeButton = getExitButton(userId)
    const actionRow = new MessageActionRow().addComponents([
      confirmButton,
      revokeButton,
    ])
    const requiredNft = nft_requirement
      ? `${nft_requirement.amount} ${nft_requirement.symbol}`
      : "0"
    const requiredToken = token_requirement
      ? `${token_requirement.amount} ${token_requirement.symbol}`
      : "0"
    const description = `
      ${getEmoji("pointingright")} Level: ${required_level}
      ${getEmoji("pointingright")} Holding NFT: ${requiredNft}
      ${getEmoji("pointingright")} Holding Token: ${requiredToken}
      `
    const embed = composeEmbedMessage(null, {
      title: `Users will earn the role ${role_name} if they meet all of these requirements`,
      description,
    })
    await send({ embeds: [embed], components: [actionRow] })
    let interaction = await message.channel?.awaitMessageComponent({
      filter: (i) => i.user.id === userId && i.customId === customId,
      time: 15_000,
    })
    await interaction?.deferUpdate()
    const { ok, error, curl, log } = await config.setConfigMixRole({
      guild_id,
      role_id,
      required_level,
      nft_requirement,
      token_requirement,
    })
    if (!ok) {
      if (error.startsWith("Mix role config already existed")) {
        const title = "Invalid Role"
        const description = `
          Your role has been used for an existing NFT role. Please choose another one.
          ${defaultEmojis.POINT_RIGHT} Type @ to see a role list.
          ${defaultEmojis.POINT_RIGHT} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.
          `
        throw new InternalError({
          message: message,
          title,
          description,
        })
      }
      throw new APIError({
        message: message,
        error,
        curl,
        description: log,
      })
    }
    const successEmbed = getSuccessEmbed({
      title: "Successfully set",
      description: `When users qualify the requirements, they will get <@&${role_id}>`,
    })
    await interaction?.editReply({ embeds: [successEmbed], components: [] })
  }

  try {
    const role_id = await collectRole()
    const role = message.guild.roles.cache.has(role_id)
      ? message.guild.roles.cache.get(role_id)
      : await message.guild.roles.fetch(role_id)
    const role_name = role?.name ?? "-"
    const required_level = await collectLevel(role_name)
    const token_requirement = await collectToken(role_name)
    const nft_requirement = await collectNft(role_name)
    await submitConfig({
      guild_id: message.guildId ?? "",
      role_id,
      role_name,
      required_level,
      token_requirement,
      nft_requirement,
    })
  } catch (e) {
    // Need to handle error here, since the global slash command try-catch is handling err by editing the message msg.
    // In this case, we keep asking user for args
    // So, if the error occur, it will appear on top msg, which cause confusion to the user
    if (!isTextCommand) {
      let embed: MessageEmbed
      if (e instanceof InternalError) {
        embed = getErrorEmbed({
          title: e.name,
          description: e.customDescription,
        })
      } else if (e instanceof APIError) {
        embed = getErrorEmbed({
          title: e.name,
          description: e.specificError,
        })
      } else {
        embed = getErrorEmbed({ description: "Command timeout!" })
      }
      send({ embeds: [embed] })
    }
    // Still need to re-throw err for the global try-catch text command to reply msg and log things as well
    throw e
  }
}

export function isInvalidAmount(amount: number): boolean {
  return (
    Number.isNaN(amount) ||
    !Number.isInteger(amount) ||
    amount < 0 ||
    amount >= Infinity
  )
}
