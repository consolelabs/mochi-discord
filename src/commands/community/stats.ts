import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX } from "utils/constants"
import { API_BASE_URL } from "utils/constants"
import { logger } from "logger"
import fetch from "node-fetch"
import { MessagePayload, MessageEmbed } from "discord.js"

var countType: Array<string> = ['members', 'channels', 'stickers', 'emojis', 'roles'];

const command: Command = {
  id: "stats",
  command: "stats",
  brief: "Stats",
  category: "Community",
  onlyAdministrator: true,
  run: async function (msg, action) { 
    // check if cmd allows, $count channels -> allow, $count guns -> not
    const args = getCommandArguments(msg)
    let statsEmbeded = composeEmbedMessage(msg, {
      title: `Server Stats\n\n`,
      description: `Please enter what stat you want to show\n\nSupported Stats:\n- members\n- channels\n- emojis\n- stickers\n- roles`
    })
    if (args.length == 1) {
      msg.channel.send({ embeds: [statsEmbeded] }).then(() => {
        msg.channel.awaitMessages({
          max: 1,
          time: 30000,
          errors: ['time']
        })
        .then(message => {
          msg = message.first()
          let stats = msg.content
          if (countType.indexOf(msg.content) < 0) {
            let errorEmbeded = composeEmbedMessage(msg, {
              title: ' Server Stats\n\n',
              description: `This stats is not supported!`,
              color: "#FF0000"
            })
            msg.channel.send({ embeds: [errorEmbeded] })
            return null
          }
          let statsChild = ''
          switch (msg.content) {
            case 'members':
              statsChild = ' all, user, bot'
              break
            case 'channels':
              statsChild = ' all, text, voice, stage, category, announcement'
              break
            case 'emojis':
              statsChild = ' all, static, animated'
              break
            case 'stickers':
              statsChild = ' all, standard, guild'
              break
            case 'roles':
                statsChild = ' all'
                break
            default:
              statsChild = ''
              break
          }

          let stat = statsChild.replaceAll(' ', '')
          var statType: Array<string> = stat.split(',')
          // show info after "$count channels"
          statsChild = statsChild.replaceAll(' ', '- ')
          statsChild = statsChild.replaceAll(',', '\n')
          let typeEmbeded = composeEmbedMessage(msg, {
            title: `Server Stats\n\n`,
            description: `Please enter what type "` + msg.content + `" you want to show\n\nSupported type:\n` + statsChild
          })

          msg.channel.send({ embeds: [typeEmbeded] }).then(() => {
            msg.channel.awaitMessages({
              max: 1,
              time: 30000,
              errors: ['time']
            })
            .then(message => {
              msg = message.first()
              if (statType.indexOf(msg.content) < 0) {
                let errorEmbed = composeEmbedMessage(msg, {
                  title: ' Server Stats\n\n',
                  description: `This stats is not supported!`,
                  color: "#FF0000"
                })
                msg.channel.send({ embeds: [errorEmbed] })
                return null
              }
              try {
                let countTypeReq = msg.content + "_" + stats
                const res = fetch(
                  `${API_BASE_URL}/guilds/${msg.guild.id}/channels?count_type=${countTypeReq}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  },
                )
                // return null
              } catch (e: any) {
                logger.error(e)
              }

              let successEmbeded = composeEmbedMessage(msg, {
                title: `Server Stats\n\n`,
                description: `Successfully count ` + msg.content + ` ` + stats
              })
              msg.channel.send({ embeds: [successEmbeded] })
            })
            .catch(message => {
                message.channel.send('Timeout');
            });
          })
        })
          })
        }
  },
  getHelpMessage: async (msg, action) => {

    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}stats`,
      footer: [`Type ${PREFIX}help stats`],
      examples: `${PREFIX}stats`
    })

    return { embeds: [embed] }
  },
}

export default command
