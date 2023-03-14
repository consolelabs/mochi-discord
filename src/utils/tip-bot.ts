import { CommandInteraction, Message } from "discord.js"
import { parseDiscordToken } from "./commands"
import { APIError } from "errors"
import config from "adapters/config"
import { ResponseMonikerConfigData } from "types/api"
import { SPACES_REGEX } from "./constants"
import { equalIgnoreCase, hasRole, isNotBot, isStatus } from "./common"
import defi from "adapters/defi"

const TIP_TARGET_TEXT_SELECTOR_MAPPINGS: Array<[string, string]> = [
  //
  ["in my voice channel", "voice"],
  ["in voice channel", "voice"],
  ["voice channel", "voice"],
  ["voice", "voice"],
  //
  ["online", "online"],
  ["@everyone", "all"],
  ["@here", "all"],
]

export function classifyTipSyntaxTargets(msgContent: string): {
  targets: Array<string>
  isValid: boolean
} {
  let content = msgContent
  const targetSet = new Set<string>()
  const result: {
    targets: Array<string>
    isValid: boolean
  } = {
    targets: [],
    isValid: false,
  }
  let selector
  while (
    (selector = TIP_TARGET_TEXT_SELECTOR_MAPPINGS.find((s) =>
      content.toLowerCase().includes(s[0])
    )) !== undefined
  ) {
    const [s, translatedSelector] = selector
    content = content.replace(s, "").replaceAll(/\s{2,}/gim, " ")
    targetSet.add(translatedSelector)
  }
  content = content.trim()

  const components = content.length ? content.split(" ") : []
  const invalidTargets = components.filter((c) => {
    const { isRole, isChannel, isUser } = parseDiscordToken(c)

    if (isRole || isChannel || isUser) {
      targetSet.add(c)
      return false
    }
    return true
  })

  result.targets = Array.from<string>(targetSet)
  // all syntax are correct
  if (invalidTargets.length === 0) result.isValid = true

  return result
}

export async function parseRecipients(
  msg: Message | CommandInteraction,
  targets: string[],
  fromDiscordId: string
) {
  const isOnline = targets.includes("online")
  return Array.from(
    new Set(
      (
        await Promise.all(
          targets.map(async (target) => {
            const {
              isUser,
              isRole,
              isChannel,
              value: targetId,
            } = parseDiscordToken(target)
            switch (true) {
              // role
              case isRole: {
                if (!msg.guild?.members) return []
                const members = (await msg.guild.members.fetch())
                  .filter(isNotBot)
                  .filter(hasRole(targetId))
                  .filter(isStatus(isOnline))
                return members.map((member) => member.user.id)
              }

              // user
              case isUser: {
                const member = await msg.guild?.members.fetch(targetId)
                if (!member || !isNotBot(member)) return []
                return [targetId]
              }

              case isChannel: {
                if (!msg.guild?.members) return []
                // fetch guild members otherwise the list will not be full (cached)
                await msg.guild.members.fetch()
                const channel = await msg.guild.channels.fetch(targetId)
                if (!channel) return []
                if (channel.isText() && !channel.isThread()) {
                  return Array.from(
                    channel.members
                      .filter(isNotBot)
                      .filter(isStatus(isOnline))
                      .keys()
                  )
                }
                return []
              }

              case target.toLowerCase() === "online" &&
                targets.every(
                  (t) =>
                    !parseDiscordToken(t).isChannel &&
                    !parseDiscordToken(t).isRole
                ): {
                if (!msg.guild?.members) return []
                const members = (await msg.guild.members.fetch())
                  .filter((m) => !m.user.bot)
                  .filter(
                    (mem) =>
                      Boolean(mem.presence?.status) &&
                      mem.presence?.status !== "offline" &&
                      mem.presence?.status !== "invisible"
                  )
                return members.map((member) => member.user.id)
              }

              // voice channel
              case target.toLowerCase() === "voice": {
                if (!msg.guild?.members || msg instanceof CommandInteraction)
                  return []
                // fetch guild members otherwise the list will not be full (cached)
                const members = await msg.guild.members.fetch({ force: true })

                const voiceChannelId = msg.member?.voice.channelId
                if (!voiceChannelId) return []

                const recipients = Array.from(
                  members
                    .filter((m) => m.voice.channelId === voiceChannelId)
                    .mapValues((m) => m.user.id)
                    .values()
                )
                return recipients
              }

              // get all
              case target === "all": {
                if (!msg.guild?.members) return []
                const members = (await msg.guild.members.fetch())
                  .filter(isNotBot)
                  .filter(isStatus(isOnline))
                  .filter(
                    (mem) =>
                      mem.roles.cache
                        .map((role) => role.name)
                        .includes("@everyone") ||
                      mem.roles.cache.map((role) => role.name).includes("@here")
                  )
                return members.map((member) => member.user.id)
              }
            }
            return []
          })
        )
      )
        .flat()
        .filter(
          (toDiscordId) => toDiscordId !== "" && toDiscordId !== fromDiscordId
        )
    )
  )
}

export async function parseMonikerinCmd(args: string[], guildId: string) {
  const { ok, data, log, curl } = await config.getMonikerConfig(guildId)
  if (!ok) {
    throw new APIError({
      description: log,
      curl,
    })
  }
  let newArgs = args
  let moniker: ResponseMonikerConfigData | undefined
  if (data && Array.isArray(data) && data.length !== 0) {
    const content = args.join(" ").trim()
    data.forEach((v: ResponseMonikerConfigData) => {
      const tmp = v.moniker?.moniker
      if (!tmp) return
      const sym = v.moniker?.token?.token_symbol
      if (!sym) return
      if (content.includes(tmp)) {
        moniker = v
        newArgs = content.replace(tmp, sym).split(SPACES_REGEX)
      }
    })
  } else {
    const {
      ok: okDefault,
      data: dataDefault,
      log: logDefault,
      curl: curlDefault,
    } = await config.getDefaultMoniker()
    if (!okDefault) {
      throw new APIError({
        description: logDefault,
        curl: curlDefault,
      })
    }
    if (dataDefault && Array.isArray(dataDefault) && dataDefault.length !== 0) {
      const content = args.join(" ").trim()
      dataDefault.forEach((v: ResponseMonikerConfigData) => {
        const tmp = v.moniker?.moniker
        if (!tmp) return
        const sym = v.moniker?.token?.token_symbol
        if (!sym) return
        if (content.includes(tmp)) {
          moniker = v
          newArgs = content.replace(tmp, sym).split(SPACES_REGEX)
        }
      })
    }
  }
  return {
    newArgs,
    moniker,
  }
}

export async function isTokenSupported(symbol: string): Promise<boolean> {
  const { ok, error, curl, log, data } = await defi.getAllTipBotTokens()
  if (!ok) {
    throw new APIError({ curl, description: log, error })
  }
  const tokens = data.map((t: any) => t.token_symbol.toUpperCase())
  if (tokens.includes(symbol.toUpperCase())) return true
  return false
}

export async function getToken(symbol: string) {
  const { ok, error, curl, log, data } = await defi.getAllTipBotTokens()
  if (!ok) {
    throw new APIError({ curl, description: log, error })
  }
  return data.find((t: any) => equalIgnoreCase(t.token_symbol, symbol))
}
