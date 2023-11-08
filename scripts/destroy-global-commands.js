import dotenv from "dotenv"
dotenv.config()
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "";

import Discord from "discord.js"
const client = new Discord.Client({
  intents: [ Discord.Intents.FLAGS.GUILDS,  Discord.Intents.FLAGS.GUILD_MESSAGES],
});

client.login(DISCORD_TOKEN);

client.on("ready", async () => {
  const commands = await client.application.commands.fetch();

  if (commands.size === 0) {
    console.log("Could not find any global commands.");
    process.exit();
  }

  let deletedCount = 0;

  commands.forEach(async (command) => {
    await client.application.commands.delete(command.id);
    console.log(`Slash Command with ID ${command.id} has been deleted.`);
    deletedCount++;

    if (deletedCount === commands.size) {
      console.log(`Successfully deleted all global slash commands.`);
      process.exit();
    }
  });
});