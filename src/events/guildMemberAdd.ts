import { Event } from "."
import Discord from "discord.js"
import client from "../index"
import { invites } from "./index"
import { logger } from "../logger"
import User, { UserInput } from "../modules/users"
import InviteHistory, {InviteHistoryInput, InviteeCountInput} from "../modules/inviteHistories"
import guildConfig from "modules/guildConfig"

export default {
	name: "guildMemberAdd",
	once: false,
	execute: async (member: Discord.GuildMember) => {
		const newInvites = await member.guild.invites.fetch()
		const oldInvites = invites.get(member.guild.id);
		const invite = newInvites.find(i => i.uses > (oldInvites as Discord.Collection<string, number>).get(i.code));
		(invites.get(invite.guild.id) as Discord.Collection<string,number>).set(invite.code, invite.uses);
		const inviter = await client.users.fetch(invite.inviter.id);
		const guild = await guildConfig.getGuildConfig(member.guild.id);
		const logChannel = member.guild.channels.cache.find(channel => channel.id === guild.log_channel_id) as Discord.TextChannel;
		
		const indexInviterResponse = await User.indexUser(
			{
				id: inviter.id,
				username: inviter.username,
				guild_id: member.guild.id,
			} as UserInput
		)
		if (indexInviterResponse.error) {
			logger.error(`Error indexing inviter: ${indexInviterResponse.error}`)
			logChannel.send(`I can not figure out how <@${member.user.id}> joined the server`);
			return;
		}
		
		const indexInviteeResponse = await User.indexUser(
			{
				id: member.user.id,
				username: member.user.username,
				guild_id: member.guild.id
			} as UserInput
		)
		if (indexInviteeResponse.error) {
			logger.error(`Error indexing invitee: ${indexInviteeResponse.error}`)
			logChannel.send(`I can not figure out how <@${member.user.id}> joined the server`);
			return;
		}
		
		if (inviter) {
			const indexInviteHistoryResponse = await InviteHistory.indexInviteHistory(
				{
					guild_id: member.guild.id,
					inviter: inviter.id,
					invitee: member.user.id
				} as InviteHistoryInput
			)
			if (indexInviteHistoryResponse.error) {
				logger.error(`Error indexing invite history: ${indexInviteHistoryResponse.error}`)
				logChannel.send(`I can not figure out how <@${member.user.id}> joined the server`);
				return;
			}
			
			const inviteAmountResponse = await InviteHistory.getInvitees(
				{
					guild_id: member.guild.id,
					inviter: inviter.id
				} as InviteeCountInput
			)
			if (inviteAmountResponse.error) {
				logger.error(`Error getting invite amount: ${inviteAmountResponse.error}`)
				logChannel.send(`I can not figure out how <@${member.user.id}> joined the server`);
				return;
			}
    	logChannel.send(`<@${member.user.id}> has been invited by <@${inviter.id}> and has now ${inviteAmountResponse.data} invices.`)
		} else {
			logChannel.send(`<@${member.user.id}> joined using a vanity invite`)
		}
	},
} as Event<"guildMemberAdd">
