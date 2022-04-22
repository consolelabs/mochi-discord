import { MessageEmbed, MessageOptions } from "discord.js";
import { logger } from "logger";
import { Command, ReactionRoleConfig } from "types/common"
import { workInProgress } from "utils/discord-embed"
import { reactionRoleConfigs } from "utils/common"; 

const getReactionEmbed = async (roleConfs: ReactionRoleConfig[]): Promise<MessageOptions> => {

  let footer: string = ''
  let thumbnail = 'https://media.discordapp.net/stickers/920582158689652746.webp?size=320'
  
  const description: string = 'The default roles will grant automatically after verification, based on your neko holding status & faction EXPs.' 
      + 'Other special roles are granted by mods or self-assign.'
      + '\nPlease react for associated roles to get **appropriate alerts**'
      + '\n\n**Choosing a team will allow you to interact with your teammates:**\n'
  
  // render footer by passed role configs
  roleConfs.forEach(conf => footer += `${conf.roleEmoji} for ${conf.roleName}\n`)
  
  let embed = new MessageEmbed()
    .setColor('#FF6FB5')
    .setTitle('Self-assign Roles')
    .setThumbnail(thumbnail)
    .setDescription(description)
    .setFooter(footer)
  
  return { embeds: [embed] };
}

const command: Command = {
  id: "reaction",
  name: "Setup reactions for users to self-assign their roles",
  command: "reaction",
  alias: ["react", "reacts", "reactions"],
  category: "Config",
  canRunWithoutAction: true,
  run: async (msg) => {
    const embed = await getReactionEmbed(reactionRoleConfigs);
    let messageEmbed = await msg.channel.send(embed);
    logger.info(`Created a new reaction message with ID: ${messageEmbed.id}`)
    reactionRoleConfigs.forEach(async conf => await messageEmbed.react(conf.roleEmoji))
  },
  getHelpMessage: workInProgress,
  experimental: true,
}

export default command
