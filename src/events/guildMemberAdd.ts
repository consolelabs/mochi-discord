import { Event } from "."
import Discord from "discord.js"
import client from "../index"
import { invites } from "./index"
import { LOG_CHANNEL_ID } from "env"
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
		
		const indexUserResponse = await User.indexUser(
			{
				id: member.user.id,
				username: member.user.username,
				guild_id: member.guild.id
			} as UserInput
		)
		if (indexUserResponse.error) {
			logChannel.send(`Failed to index user ${inviter.username}`);
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
				logChannel.send(`Failed to index invite history for ${inviter.username}`);
				return;
			}
			
			const inviteAmountResponse = await InviteHistory.getInvitees(
				{
					guild_id: member.guild.id,
					inviter: inviter.id
				} as InviteeCountInput
			)
			if (inviteAmountResponse.error) {
				logChannel.send(`Failed to get invite amount for ${inviter.username}`);
				return;
			}
    	logChannel.send(`<@${member.user.id}> has been invited by <@${inviter.id}> and has now ${inviteAmountResponse.data} invices.`)
		} else {
			logChannel.send(`<@${member.user.id}> joined using a vanity invite`)
		}
	},
} as Event<"guildMemberAdd">
