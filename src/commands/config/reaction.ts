import { Message, MessageEmbed, MessageOptions } from "discord.js";
import { Command, ReactionRoleConfig, ReactionRoleConfigResponse, ReactionRole } from "types/common"
import { workInProgress } from "utils/discord-embed"
import reactionRole from "adapters/reactionRole";
import { DISCORD_BOT_GUILD_ID } from "env";

const getReactionEmbed = async (conf: ReactionRoleConfig, roles: ReactionRole[]): Promise<MessageOptions> => {
  const description = conf.description.split("\\n").join("\n")
  let footer = ''

  if (roles?.length) {
    roles.forEach(r => footer += `${r.reaction} for ${r.role_name}\n`)
  }
  
  let embed = new MessageEmbed()
    .setColor('#FF6FB5')
    .setTitle(conf.title)
    .setThumbnail(conf.thumbnail_url)
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
  run: async (msg: Message) => {
    const configs: ReactionRoleConfigResponse = await reactionRole.getAllReactionConfigs(DISCORD_BOT_GUILD_ID)

    // Reconfigure reaction messages by response from BE
    configs.data.forEach(async conf => {
      const roles: ReactionRole[] = JSON.parse(conf.reaction_roles);
      const updateEmbed = await getReactionEmbed(conf, roles)
      const sentMsg = await msg.channel.messages.fetch({around: conf.message_id, limit: 1})
      const fetchedMsg = sentMsg.first()
      await fetchedMsg.edit(updateEmbed)
      await fetchedMsg.reactions.removeAll();

      if (roles?.length) {
        roles.forEach(async conf => await fetchedMsg.react(conf.reaction))
      }
    }) 
  },
  getHelpMessage: workInProgress,
  experimental: true,
}

export default command
