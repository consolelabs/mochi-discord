import { Message, TextChannel, DiscordAPIError } from "discord.js"
import { logger } from "../logger"
import { CustomCommand } from "../adapters/guildCustomCommand"
import { DirectMessageNotAllowedError, BotBaseError } from "errors"

const ServerCooldown = new Map()

const UserCooldown = new Map()

export async function customCommandsExecute(
  message: Message,
  cmd: CustomCommand
) {
  try {
    if (cmd.cooldown) {
      switch (cmd.cooldown) {
        case 1: {
          if (
            UserCooldown.has(
              `${message.guildId}-${message.author.id}-${cmd.id}`
            ) &&
            UserCooldown.get(
              `${message.guildId}-${message.author.id}-${cmd.id}`
            ) > Date.now()
          ) {
            await message.channel.send(
              `You can only use this command once every ${cmd.cooldown_duration} seconds.`
            )
            return
          }
          break
        }
        case 2: {
          if (ServerCooldown.has(`${message.guildId}-${cmd.id}`)) {
            const cooldownTime = ServerCooldown.get(
              `${message.guildId}-${cmd.id}`
            )
            if (cooldownTime > Date.now()) {
              await message.channel.send(
                `This command is on cooldown for ${(
                  (cooldownTime - Date.now()) /
                  1000
                ).toFixed(1)} secs.`
              )
              return
            }
          }
        }
      }
    }

    if (cmd.roles_permissions && cmd.roles_permissions.default_behavior) {
      switch (cmd.roles_permissions.default_behavior) {
        case "allow_all": {
          for (let e = 0; e < cmd.roles_permissions.exclude.length; e++) {
            if (message.author.id === cmd.roles_permissions.exclude[e]) {
              await message.reply("You are not allowed to use this command.")
              return
            }
          }
          break
        }
        case "deny_all": {
          for (let e = 0; e < cmd.roles_permissions.exclude.length; e++) {
            if (message.author.id === cmd.roles_permissions.exclude[e]) {
              break
            }
            await message.reply("You are not allowed to use this command.")
            return
          }
        }
      }
    }

    if (cmd.channels_permissions && cmd.channels_permissions.default_behavior) {
      switch (cmd.channels_permissions.default_behavior) {
        case "allow_all": {
          for (let e = 0; e < cmd.channels_permissions.exclude.length; e++) {
            if (message.channelId === cmd.channels_permissions.exclude[e]) {
              await message.reply(
                "This command is not allowed in this channel."
              )
              return
            }
          }
          break
        }
        case "deny_all": {
          for (let e = 0; e < cmd.channels_permissions.exclude.length; e++) {
            if (message.channelId === cmd.channels_permissions.exclude[e]) {
              break
            }
            await message.reply("This command is not allowed in this channel.")
            return
          }
        }
      }
    }

    for (let i = 0; i < cmd.actions.length; i++) {
      await actionExecute(message, cmd.actions[i])
    }

    if (cmd.cooldown && cmd.cooldown > 0 && cmd.cooldown_duration > 0) {
      switch (cmd.cooldown) {
        case 1: {
          UserCooldown.set(
            `${message.guildId}-${message.author.id}-${cmd.id}`,
            Date.now() + cmd.cooldown_duration * 1000
          )
          break
        }
        case 2: {
          ServerCooldown.set(
            `${message.guildId}-${cmd.id}`,
            Date.now() + cmd.cooldown_duration * 1000
          )
        }
      }
    }
  } catch (e) {
    const error = e as BotBaseError
    if (error.handle) {
      error.handle()
    } else {
      logger.error(
        `Failed to execute custom command ${cmd.id} of ${cmd.guild_id}`,
        e
      )
    }
  }
}

async function actionExecute(message: Message, action: any) {
  const { messages, embeds, random } = action
  switch (action.type) {
    case "send": {
      const targetChannel = message.guild?.channels.cache.get(
        action.channel_id
      ) as TextChannel

      if (!targetChannel) {
        logger.info(
          `[custom-command-exec] channel ${action.channel_id} not found`
        )
        message.channel.send("target channel not found")
        return
      }

      if (embeds) {
        targetChannel.send({
          embeds: embeds,
        })
      } else {
        const msg =
          messages.length > 0
            ? random
              ? messages[Math.floor(Math.random() * messages.length)]
              : messages[0]
            : ""
        targetChannel.send(msg)
      }
      break
    }
    case "respond": {
      if (embeds) {
        message.reply({ embeds: embeds })
      } else {
        const msg =
          messages.length > 0
            ? random
              ? messages[Math.floor(Math.random() * messages.length)]
              : messages[0]
            : ""
        message.reply(msg)
      }
      break
    }
    case "dm": {
      if (embeds) {
        await message.author.send({ embeds: embeds }).catch((e) => {
          if (e instanceof DiscordAPIError && e.code === 50007) {
            throw new DirectMessageNotAllowedError({ message })
          }
        })
      } else {
        const msg =
          messages.length > 0
            ? random
              ? messages[Math.floor(Math.random() * messages.length)]
              : messages[0]
            : ""
        await message.author.send(msg).catch((e) => {
          if (e instanceof DiscordAPIError && e.code === 50007) {
            throw new DirectMessageNotAllowedError({ message })
          }
        })
      }
      break
    }
  }
}
