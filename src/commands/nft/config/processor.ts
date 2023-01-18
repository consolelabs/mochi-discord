import { getSuccessEmbed } from "ui/discord/embed"
import config from "adapters/config"

export async function handle(
  csmrKey: string,
  csmrKeyScrt: string,
  acsToken: string,
  acsTokenScrt: string,
  guildId: string
) {
  await config.createTwitterAuth(
    guildId,
    csmrKey,
    csmrKeyScrt,
    acsToken,
    acsTokenScrt
  )
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Twitter sale config",
          description: `Successfully set configs.`,
        }),
      ],
    },
  }
}
