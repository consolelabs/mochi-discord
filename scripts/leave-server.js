/* eslint-disable */
require("dotenv").config();
const Discord = require("discord.js");
const ids = require("./leave-server-ids.json");
const chunk = require("lodash/chunk");
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "";

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.GUILD_INVITES,
  ],
  partials: ["MESSAGE", "REACTION", "CHANNEL"],
});

(async () => {
  await client.login(DISCORD_TOKEN);
  const everyGuilds = await client.guilds.fetch();
  console.log(`There are currently ${everyGuilds.size} guilds`);

  const allPromises = chunk(ids, 10).map(async (batch, i) => {
    console.log(`Processing batch ${i + 1}...`);
    return Promise.allSettled(
      batch.map(async (guildId) => {
        let guild;
        try {
          guild = await client.guilds.fetch(guildId);
          if (guild) {
            console.log(`WAIT - Leaving ${guild.name}...`);
            const successStr = `OK - left ${guild.name}/${guild.id}`;
            await guild.leave();
            console.log(successStr);
          }
        } catch (e) {
          console.log(
            `FAIL - ${guild ? guild.name : "unknown guild"}/${guildId} - ${
              e.stack
            }`
          );
          return Promise.reject();
        }
        return Promise.resolve();
      })
    );
  });
  await Promise.allSettled(allPromises);
  process.exit(0);
})();
