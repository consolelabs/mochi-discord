import { Message, MessageActionRow, MessageButton, MessageEmbed, TextChannel } from "discord.js"
import { logger } from "../logger"

export async function sendVerifyMessage(message: Message, channelString: string) {
	// only run in -dev channel

	// if (process.env.NODE_ENV === 'production' && message.channel.id !== '897884266090868806') {
	// 	logger.info('[send-verify-message] not in -dev channel')
	// 	return
	// }

	// only server owner can run this command	


	logger.info('[send-verify-message] sending message')

	const verifyMessageRow = new MessageActionRow()
		.addComponents(
			new MessageButton()
				.setCustomId('verify')
				.setLabel('Verify')
				.setStyle('PRIMARY')
		)

	const verifyMessageEmbed = new MessageEmbed()
		.setColor('#DD4EF7')
		.setTitle('🤖 Verification required')
		.setDescription(`Verify your wallet. This is a read-only connection. Do not share your private keys. We will never ask for your seed phrase. We will never DM you.`)

	// get channelId from e.g <#895659000996200511>
	const channelId = channelString.split('<#')[1].split('>')[0]
	const targetChannel = message.guild.channels.cache.get(channelId) as TextChannel

	if (!targetChannel) {
		logger.info('[send-verify-message] target channel not found')
		message.channel.send('target channel not found')
		return
	}

	targetChannel.send({ embeds: [verifyMessageEmbed], components: [verifyMessageRow] })
}
