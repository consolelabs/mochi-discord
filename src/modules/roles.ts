import Discord, { Role } from "discord.js"
import { API_SERVER_HOST, DISCORD_BOT_GUILD_ID, DISCORD_POD_TOGETHER_ROLE_ID } from "../env"
import { logger } from "../logger"
import fetch from "node-fetch"
interface DiscordUserRoles {
  discord_user_roles: DiscordUserRole[]
}

interface DiscordUserRole {
  discord_id: string
  role_id: string
  guild_id: string
}

interface DiscordRoles {
  roles: DiscordRole[]
}

interface DiscordRole {
  id: string
  name: string
  guild_id: string
  number_of_token: number
}

interface PodTogetherUsers {
  data: PodTogetherUser[]
}

interface PodTogetherUser {
  discord_id: string
  address: string
  total_balance: number
  balances: Balance[]
}

interface Balance {
  token_address: string
  token_name: string
  balance: number
}

interface UserAddresses {
  data: UserAddress[]
  total: number
}

interface UserAddress {
  address: string
  discord_id: string
  tags: string[]
}


class Roles {
  /**
   * updateNekoRoles
   */
  public async updateNekoRoles(listener: Discord.Client) {
    try {
      logger.info("start update user roles")
      // get user roles from api
      const userRolesRes = await fetch(
        `${API_SERVER_HOST}/api/v1/neko-roles/users?guild_id=${DISCORD_BOT_GUILD_ID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      const discordUserRolesData: DiscordUserRoles = await userRolesRes.json()

      const guild = listener.guilds.cache.get(DISCORD_BOT_GUILD_ID)
      await guild.members.fetch()

      const rolesRes = await fetch(`${API_SERVER_HOST}/api/v1/neko-roles?guild_id=${DISCORD_BOT_GUILD_ID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const rolesData: DiscordRoles = await rolesRes.json()

      // update roles to discord
      discordUserRolesData.discord_user_roles.forEach(async (discordUserRole) => {
        let member: Discord.GuildMember
        try {
          member = await guild.members.fetch(discordUserRole.discord_id)
        }
        catch (e) {
          // logger.error(`error fetching member ${discordUserRole.discord_id}`, e)
          return
        }

        const roleIdsOnDiscord = member.roles.cache.map((role) => role.id)
        const currentRoles = rolesData.roles.filter((role) =>
          roleIdsOnDiscord.includes(role.id)
        )

        // if somehow user has greater 1 role, remove all current roles
        if (currentRoles.length > 1) {
          currentRoles.forEach(async (role) => {
            logger.info(`removing role ${guild.roles.cache.get(role.id).name} from ${member.user.username}`)
            member.roles.remove(role.id)
          })
        }

        // do nothing if role not changed
        if (currentRoles.length === 1 && currentRoles[0].id === discordUserRole.role_id) return

        // if role changed, remove the old one
        if (currentRoles.length === 1 && currentRoles[0].id !== discordUserRole.role_id) member.roles.remove(currentRoles[0].id)

        // add new role
        const newRoleName = rolesData.roles.filter((role) => role.id === discordUserRole.role_id)[0].name
        logger.info(`adding role ${newRoleName} for ${member.user.username}`)
        await member.roles
          .add(discordUserRole.role_id)
          .catch((err) => logger.error(`error adding role ${newRoleName} for ${member.user.username}`, err))
      })
    } catch (e: any) {
      logger.error(e)
    }
  }
  /**
   * updatePodTogetherRoles
   */
  public async updatePodTogetherRoles(listener: Discord.Client) {
    try {
      logger.info("start update roles")
      // get users
      const podTogetherUsers: PodTogetherUsers = await (await fetch(
        `${API_SERVER_HOST}/api/v1/pod-together/users`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )).json()

      const guild = listener.guilds.cache.get(DISCORD_BOT_GUILD_ID)
      await guild.members.fetch()

      const membersOnDiscord = guild.roles.cache.get(DISCORD_POD_TOGETHER_ROLE_ID).members.map((member) => member.id)
      const membersOnDB = podTogetherUsers.data.filter((p) => p.total_balance > 0).map((user) => user.discord_id)

      const membersToAdd = membersOnDB.filter((member) => !membersOnDiscord.includes(member))
      const membersToRemove = membersOnDiscord.filter((member) => !membersOnDB.includes(member))

      // remove roles
      membersToRemove.forEach(async (m) => {
        let member: Discord.GuildMember
        try {
          member = await guild.members.fetch(m)
        } catch (e) {
          return
        }

        const currentRoles = member.roles.cache.map((role) => role.id).filter((roleId) => roleId === DISCORD_POD_TOGETHER_ROLE_ID)
        if (currentRoles.length === 1) {
          await member.roles.remove(DISCORD_POD_TOGETHER_ROLE_ID)
            .catch((err) => logger.error(`error removing role ${guild.roles.cache.get(DISCORD_POD_TOGETHER_ROLE_ID).name} from ${member.user.username}`, err))
        }
      })

      // add roles
      membersToAdd.forEach(async (m) => {
        let member: Discord.GuildMember
        try {
          member = await guild.members.fetch(m)
        } catch (e) {
          return
        }

        const currentRoles = member.roles.cache.map((role) => role.id).filter((roleId) => roleId === DISCORD_POD_TOGETHER_ROLE_ID)
        if (currentRoles.length === 0) {
          await member.roles.add(DISCORD_POD_TOGETHER_ROLE_ID)
            .catch((err) => logger.error(`error adding role ${guild.roles.cache.get(DISCORD_POD_TOGETHER_ROLE_ID).name} for ${member.user.username}`, err))
        }
      })

    }
    catch (e: any) {
      logger.error(e)
    }
  }

  /**
   * updateFellowshipRole
   */
  public async updateFellowshipRole(listener: Discord.Client) {
    try {
      const userAddresses: UserAddresses = await (await fetch(`${API_SERVER_HOST}/api/v1/user/addresses?tags=fellowship`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })).json()

      const guild = listener.guilds.cache.get(DISCORD_BOT_GUILD_ID)
      const fellowshipRoleID = "922001923505258536"

      // get users on guild who have fellowship role
      const FellowshipMembersOnGuild = guild.roles.cache.get(fellowshipRoleID).members.map((member) => member.id)

      // get users on db who have fellowship role
      const fellowshipMembersOnDB = userAddresses.data.filter((user) => user.tags.includes("fellowship")).map((user) => user.discord_id)

      // get users to add
      const fellowshipMembersToAdd = fellowshipMembersOnDB.filter((member) => !FellowshipMembersOnGuild.includes(member))

      // get users to remove
      const fellowshipMembersToRemove = FellowshipMembersOnGuild.filter((member) => !fellowshipMembersOnDB.includes(member))

      // remove fellowship roles
      logger.info(`removing fellowship roles for ${fellowshipMembersToRemove.length} users`)
      await Promise.all(
        fellowshipMembersToRemove.map(async (m) => {
          let member: Discord.GuildMember
          try {
            member = await guild.members.fetch(m)
          } catch (e) {
            return
          }

          logger.info(`removing fellowship role for ${member.user.username}`)
          const currentRoles = member.roles.cache.map((role) => role.id).filter((roleId) => roleId === fellowshipRoleID)
          if (currentRoles.length === 1) {
            await member.roles.remove(fellowshipRoleID)
              .catch((err) => logger.error(`error removing role ${guild.roles.cache.get(fellowshipRoleID).name} from ${member.user.username}`, err))
          }
        })
      )
      logger.info(`removed fellowship roles for ${fellowshipMembersToRemove.length} users`)

      // add fellowship roles
      logger.info(`adding fellowship role for ${fellowshipMembersToAdd.length} users`)
      await Promise.all(
        fellowshipMembersToAdd.map(async (f) => {
          let member: Discord.GuildMember
          try {
            member = await guild.members.fetch(f)
          } catch (e) {
            return
          }

          logger.info(`adding fellowship role for ${member.user.username}`)
          const currentRoles = member.roles.cache.map((role) => role.id).filter((roleId) => roleId === fellowshipRoleID)
          if (currentRoles.length === 0) {
            await member.roles.add(fellowshipRoleID)
              .catch((err) => logger.error(`error adding role ${guild.roles.cache.get(fellowshipRoleID).name} for ${member.user.username}`, err))
          }
        })
      )
      logger.info(`added fellowship role for ${fellowshipMembersToAdd.length} users`)

    }
    catch (e: any) {
      logger.error(e)
    }
  }

}
export default new Roles()
