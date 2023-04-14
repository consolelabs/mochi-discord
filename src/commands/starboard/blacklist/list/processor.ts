import { getEmoji } from "utils/common"

export function composeListConfig(data: any) {
  if (!data || data?.length === 0) {
    return {
      title: "No starboard blacklists found",
      description: `You haven't configured any starboard blacklist channels.\n\n${getEmoji(
        "ANIMATED_POINTING_RIGHT", true
      )} To set a new one, run \`\`\`$sb blacklist set <channel>\`\`\``,
    }
  }
  return {
    title: "Starboard Blacklist Channel Configuration",
    description: data
      ?.map((item: any, idx: number) => `**${idx + 1}.** <#${item.channel_id}>`)
      .join("\n"),
  }
}
