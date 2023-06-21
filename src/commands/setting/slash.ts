import { CommandInteraction, Message } from "discord.js"
import { renderSetting, SettingTab } from "./processor"
import { MachineConfig, route } from "utils/router"

const machineConfig: MachineConfig = {
  id: "setting",
  initial: "userSetting",
  context: {
    button: {
      userSetting: () => renderSetting(SettingTab.User),
      serverSetting: () => renderSetting(SettingTab.Server),
    },
  },
  states: {
    userSetting: {
      on: {
        VIEW_SERVER_SETTING: "serverSetting",
      },
    },
    serverSetting: {
      on: {
        VIEW_USER_SETTING: "userSetting",
      },
    },
  },
}

const run = async (interaction: CommandInteraction) => {
  const { msgOpts } = await renderSetting()

  const replyMsg = (await interaction.editReply(msgOpts)) as Message

  route(replyMsg, interaction, machineConfig)
}

export default run
