import { disabledVoteEmbed } from "./processor"

const run = async () => ({
  messageOptions: {
    embeds: [disabledVoteEmbed()],
  },
})
export default run
