import { GuildEmoji, Message, MessageEmbed, MessageOptions } from "discord.js";
import { logger } from "logger";
import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"
import { reactionRoleEmojis } from "utils/common"; 

const { GREEN_TEAM, PURPLE_TEAM, YELLOW_TEAM } = reactionRoleEmojis; // TODO: Should be fetched from API

const getReactionEmbed = async (): Promise<MessageOptions> => {
  
  let embed = new MessageEmbed()
    .setColor('#e42643')
    .setTitle('Self-assign Roles')
    .setThumbnail(
      "https://media.discordapp.net/stickers/920582158689652746.webp?size=320"
    )
    .setDescription('The default roles will grant automatically after verification, based on your neko holding status & faction EXPs. Other special roles are granted by mods or self-assign.'
      + '\nPlease react for associated roles to get **appropriate alerts**'
      + '\n\n**Choosing a team will allow you to interact with your teammates:**\n')
    .setFooter(`${YELLOW_TEAM} for Yellow team\n`
      + `${PURPLE_TEAM} for Purple team\n`
      + `${GREEN_TEAM} for Green team`)
  
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
    const embed = await getReactionEmbed();
    let messageEmbed = await msg.channel.send(embed);
        
    messageEmbed.react(GREEN_TEAM);
    messageEmbed.react(PURPLE_TEAM);
    messageEmbed.react(YELLOW_TEAM);
  },
  getHelpMessage: workInProgress,
  experimental: true,
}

export default command
