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
import { getEmoji, msgColors } from "utils/common"

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
    time: 180_000,
    errors: ["time"],
  }

  const userCancelEmbed = getErrorEmbed({
    title: "Command canceled",
    description: "User canceled the command.",
  })

  const revokeCustomId = "mix_role_btn_revoke"
  const revokeButton = new MessageButton({
    label: "Cancel",
    emoji: getEmoji("revoke"),
    customId: revokeCustomId,
    style: "DANGER",
  })

  const collectRole: () => Promise<{
    roleId: string
    isCanceled: boolean
  }> = async () => {
    const title = `${getEmoji(
      "mag"
    )} Please enter the role you want to assign by level, amount of NFT, and token.`
    const embed = composeEmbedMessage(null, { title, color: msgColors.PINK })
    await send({
      embeds: [embed],
      components: [new MessageActionRow().addComponents(revokeButton)],
    })
    let isCanceled = false
    const cancelCollector = message.channel?.createMessageComponentCollector({
      filter: (i) => i.customId === revokeCustomId && i.user.id === userId,
    })
    cancelCollector?.on("collect", async (i) => {
      isCanceled = true
      await i.deferUpdate()
      await i.editReply({
        embeds: [userCancelEmbed],
        components: [],
      })
    })

    const collected = await message.channel?.awaitMessages(options)
    // received user input, stop collect cancel btn
    cancelCollector?.stop()

    if (isCanceled) return { roleId: "", isCanceled }

    const roleArg = collected?.first()?.content?.trim() ?? ""
    const { isRole, value: roleId } = parseDiscordToken(roleArg)
    if (!isRole) {
      const title = "Invalid role"
      const description = `
      Your role is invalid. Make sure that role exists, or that you have entered it correctly.\n
      ${getEmoji("pointingright")} Type @ to see a role list.
      ${getEmoji(
        "pointingright"
      )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.`
      await send({ embeds: [getErrorEmbed({ title, description })] })
      return await collectRole()
    }
    const { ok, data, error, curl, log } = await config.getConfigMixRoleList({
      guild_id: message.guildId ?? "",
    })
    if (!ok) {
      throw new APIError({ error, curl, description: log })
    }
    if (data.filter((config) => config.role_id === roleId).length !== 0) {
      const title = "Invalid Role"
      const description = `
        Your role has been used for an existing mix role. Please choose another one.
        ${getEmoji("POINTINGRIGHT")} Type @ to see a role list.
        ${getEmoji(
          "POINTINGRIGHT"
        )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.
        `
      await send({ embeds: [getErrorEmbed({ title, description })] })
      return await collectRole()
    }
    return { roleId, isCanceled }
  }

  const collectLevel: (
    roleName: string
  ) => Promise<{ level: number; isCanceled: boolean }> = async (roleName) => {
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
      color: msgColors.PINK,
    })
    await send({
      embeds: [embed],
      components: [new MessageActionRow().addComponents(revokeButton)],
    })
    let isCanceled = false
    const cancelCollector = message.channel?.createMessageComponentCollector({
      filter: (i) => i.customId === revokeCustomId && i.user.id === userId,
    })
    cancelCollector?.on("collect", async (i) => {
      isCanceled = true
      await i.deferUpdate()
      await i.editReply({
        embeds: [userCancelEmbed],
        components: [],
      })
    })

    const collected = await message.channel?.awaitMessages(options)
    // received user input, stop collect cancel btn
    cancelCollector?.stop()

    if (isCanceled) {
      return { level: 0, isCanceled }
    }

    const levelArg = collected?.first()?.content?.trim() ?? ""
    if (levelArg === "0" || levelArg?.toLocaleLowerCase() === "no") {
      return { level: 0, isCanceled }
    }
    const level = +levelArg
    if (isInvalidAmount(level)) {
      const title = "Command error"
      const description =
        "The level is invalid. Please insert a natural number."
      await send({ embeds: [getErrorEmbed({ title, description })] })
      return await collectLevel(roleName)
    }
    return { level, isCanceled }
  }

  const collectNft: (roleName: string) => Promise<{
    requirement?: {
      amount: number
      nft_id: string
      symbol: string
    }
    isCanceled: boolean
  }> = async (roleName) => {
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
      color: msgColors.PINK,
    })
    await send({
      embeds: [embed],
      components: [new MessageActionRow().addComponents(revokeButton)],
    })
    let isCanceled = false
    const cancelCollector = message.channel?.createMessageComponentCollector({
      filter: (i) => i.customId === revokeCustomId && i.user.id === userId,
    })
    cancelCollector?.on("collect", async (i) => {
      isCanceled = true
      await i.deferUpdate()
      await i.editReply({
        embeds: [userCancelEmbed],
        components: [],
      })
    })

    const collected = await message.channel?.awaitMessages(options)
    // received user input, stop collect cancel btn
    cancelCollector?.stop()

    if (isCanceled) {
      return { isCanceled }
    }

    const nftArgs = collected?.first()?.content?.trim() ?? ""
    if (nftArgs === "0" || nftArgs?.toLocaleLowerCase() === "no") {
      return { isCanceled }
    }
    const [amountArg, address] = nftArgs.split(" ")
    const amount = +amountArg
    if (isInvalidAmount(amount)) {
      const title = "Invalid amount"
      const description = "Invalid amount desc"
      await send({ embeds: [getErrorEmbed({ title, description })] })
      await collectNft(roleName)
    }
    if (!address) {
      const title = "Invalid Token address"
      const description =
        "We cannot find your token address! Please enter a valid one!"
      await send({ embeds: [getErrorEmbed({ title, description })] })
      await collectNft(roleName)
    }
    const { ok, data, error, curl, log } =
      await community.getNFTCollectionDetail({
        collectionAddress: address,
        queryAddress: true,
      })
    if (error?.toLowerCase().startsWith("record not found")) {
      const title = "Invalid Token address"
      const description =
        "The collection has not supported yet. Please enter a valid one or contact us to support!"
      await send({ embeds: [getErrorEmbed({ title, description })] })
      return await collectNft(roleName)
    }
    if (!ok) {
      throw new APIError({
        msgOrInteraction: message,
        error,
        description: log,
        curl,
      })
    }
    return {
      requirement: {
        amount,
        nft_id: data.id,
        symbol: data.symbol,
      },
      isCanceled,
    }
  }

  const collectToken: (roleName: string) => Promise<{
    requirement?: {
      amount: number
      token_id: number
      symbol: string
    }
    isCanceled: boolean
  }> = async (roleName) => {
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
      color: msgColors.PINK,
    })
    await send({
      embeds: [embed],
      components: [new MessageActionRow().addComponents(revokeButton)],
    })
    let isCanceled = false
    const cancelCollector = message.channel?.createMessageComponentCollector({
      filter: (i) => i.customId === revokeCustomId && i.user.id === userId,
    })
    cancelCollector?.on("collect", async (i) => {
      isCanceled = true
      await i.deferUpdate()
      await i.editReply({
        embeds: [userCancelEmbed],
        components: [],
      })
    })

    const collected = await message.channel?.awaitMessages(options)
    // received user input, stop collect cancel btn
    cancelCollector?.stop()

    if (isCanceled) {
      return { isCanceled }
    }

    const tokenArgs = collected?.first()?.content.trim() ?? ""
    if (tokenArgs === "0" || tokenArgs?.toLocaleLowerCase() === "no") {
      return { isCanceled }
    }
    const [amountArg, address, chain] = tokenArgs.split(" ")
    const amount = +amountArg
    if (isInvalidAmount(amount)) {
      const title = "Command error"
      const description =
        "The amount is invalid. Please insert a natural number."
      await send({ embeds: [getErrorEmbed({ title, description })] })
      return await collectToken(roleName)
    }
    if (!address) {
      const title = "Invalid Token address"
      const description =
        "We cannot find your token address! Please enter a valid one!"
      await send({ embeds: [getErrorEmbed({ title, description })] })
      return await collectToken(roleName)
    }
    if (!chain) {
      const title = "Invalid Chain"
      const description = "We cannot find your chain! Please enter a valid one!"
      await send({ embeds: [getErrorEmbed({ title, description })] })
      return await collectToken(roleName)
    }
    const { ok, data, curl, log, error } = await defi.getSupportedToken({
      address,
      chain,
    })
    if (error?.toLowerCase().startsWith("invalid chain")) {
      const title = "Invalid Chain"
      const description = "We cannot find your chain! Please enter a valid one!"
      await send({ embeds: [getErrorEmbed({ title, description })] })
      return await collectToken(roleName)
    }
    if (error?.toLowerCase().startsWith("record not found")) {
      const title = "Invalid Token address"
      const description =
        "We cannot find your token address! Please enter a valid one!"
      await send({ embeds: [getErrorEmbed({ title, description })] })
      return await collectToken(roleName)
    }
    if (!ok) {
      throw new APIError({
        msgOrInteraction: message,
        error,
        curl,
        description: log,
      })
    }
    return {
      requirement: {
        amount,
        token_id: data.id ?? 0,
        symbol: data.symbol ?? "",
      },
      isCanceled,
    }
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
        msgOrInteraction: message,
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
      style: "SUCCESS",
    })
    const revokeButton = getExitButton(userId, "Cancel")
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
      color: msgColors.PINK,
    })
    await send({ embeds: [embed], components: [actionRow] })
    const interaction = await message.channel?.awaitMessageComponent({
      filter: (i) => i.user.id === userId && i.customId === customId,
      time: 180_000,
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
          Your role has been used for an existing mix role. Please choose another one.
          ${getEmoji("POINTINGRIGHT")} Type @ to see a role list.
          ${getEmoji(
            "POINTINGRIGHT"
          )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.
          `
        throw new InternalError({
          msgOrInteraction: message,
          title,
          description,
        })
      }
      throw new APIError({
        msgOrInteraction: message,
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
    const { roleId: role_id, isCanceled: isRoleCanceled } = await collectRole()
    if (isRoleCanceled) return

    const role = message.guild.roles.cache.has(role_id)
      ? message.guild.roles.cache.get(role_id)
      : await message.guild.roles.fetch(role_id)
    const role_name = role?.name ?? "-"

    const { level: required_level, isCanceled: isLevelCanceled } =
      await collectLevel(role_name)
    if (isLevelCanceled) return

    const { requirement: token_requirement, isCanceled: isTokenCanceled } =
      await collectToken(role_name)
    if (isTokenCanceled) return

    const { requirement: nft_requirement, isCanceled: isNftCanceled } =
      await collectNft(role_name)
    if (isNftCanceled) return

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
        embed = getErrorEmbed({
          title: "Command canceled",
          description:
            "The time out for a question is 3 minutes. Please re-run the command and answer the question in 3 minutes.",
        })
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
