import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, GuildMember } from 'discord.js'
import fetch from 'node-fetch'
import { API_SERVER_HOST, PROCESSOR_API_SERVER_HOST } from '../env'
import { logger } from '../logger'
import profile, { User } from '../modules/profile'

const productChoices: [name: string, value: string][] = [
	['Wallet', 'Wallet'],
	['Vault', 'Vault'],
	['Marketplace', 'Marketplace'],
]

export default {
	data: new SlashCommandBuilder()
		.setName('alpha')
		.setDescription('Alpha Test')
		.addStringOption(option => option.setName('product').setDescription('product').setRequired(true).addChoices(productChoices))
		.addUserOption(option => option.setName('user').setDescription('user').setRequired(true))
		.addStringOption(option => option.setName('note').setDescription('note').setRequired(true)),
	async execute(interaction: CommandInteraction) {
		const product = interaction.options.getString('product')
		const user = interaction.options.getUser('user')
		const note = interaction.options.getString('note')

		const member = interaction.member as GuildMember
		// only pod gang, pod head 
		if (process.env.NODE_ENV === 'production') {
			const allowedRoles = [
				'882290383625801748', // pod head
				'882309061763297280' // pod gang
			]

			for (const roleId of allowedRoles) {
				if (member.roles.cache.has(roleId)) {
					break
				}

				interaction.reply({ content: `you are not allowed to use alpha command`, ephemeral: true })
				return
			}
		}

		// get user by discord id
		let usr: User
		try {
			usr = await profile.getUser({ discordId: user.id, guildId: interaction.guild.id })
		} catch (e) {
			interaction.reply({ content: `error: ${e}`, ephemeral: true })
			return
		}

		const body = {
			discord_id: usr.discord_id,
			product: product,
			feedback: note,
		}

		logger.info(`new alpha feedback: ${JSON.stringify(body)}`)

		// send api processor
		const resp = await fetch(
			`${API_SERVER_HOST}/api/v1/alpha/user-feedback`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			}
		)

		const json = await resp.json()
		if (resp.status !== 200) {
			interaction.reply({ content: `error: ${json.error}`, ephemeral: true })
			return
		}

		interaction.reply({
			embeds: [
				{
					title: 'Alpha Test',
					description: `Thanks ${user} for your feedback. We will work on it in next patches`,
				},
			],
		})
	},
}
