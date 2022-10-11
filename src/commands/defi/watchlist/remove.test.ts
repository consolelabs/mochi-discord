import Discord from "discord.js"
import command from "./remove"
import { getSuccessEmbed } from "utils/discordEmbed"
import { logger } from "logger";

describe("watchlist_remove", () => {
  it("watchlist remove", async () => {
    let client = new Discord.Client({ intents: [] });
    client.login()
    let guild = Reflect.construct(Discord.Guild, [client,{}]);
    let user = Reflect.construct(Discord.User,[client, {
      id: Discord.SnowflakeUtil.generate(),
    }]);
    // let member = Reflect.construct(Discord.GuildMember, [
    //   client,
    //   { id: Discord.SnowflakeUtil.generate(), user: { id: user.id } },
    //   guild
    // ]);
    // let role = Reflect.construct(Discord.Role, [
    //   client,
    //   { id: Discord.SnowflakeUtil.generate() },
    //   guild
    // ])

    let message = Reflect.construct(Discord.Message, [
      client,
      {
        content: "$watchlist remove eth",
        author: { username: "Tester", discriminator: 1234 },
        id: Discord.SnowflakeUtil.generate(),
      },
      Reflect.construct(Discord.TextChannel, [guild, {
        client: client,
        guild: guild,
        id: Discord.SnowflakeUtil.generate(),
      }])
    ]);

    const expected = {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Successfully remove!",
            description: `Token has been deleted successfully!`,
          }),
        ],
      },
    }

    // Your testing code goes here, with your functions using the message passed in as if passed on-ready
    const output = await command.run(message)
    logger.info(`${output}`)

    expect(expected).toStrictEqual(output);
  });
});