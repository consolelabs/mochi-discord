# Mochi Bot

## Overview

This repository is what you need to run your own local Mochi bot

## How to contribute

### Prerequisites

1. Install node.js
2. Install docker
3. Install canvas packages

```
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

4. [Set up discord bot](https://www.notion.so/ac75c9b08f54477ba4d8d8d20715adc3)

### How to run source code locally

In the root of project folder

1. Create file `.env` by cloning from `.env-sample`

```
cp .env-sample .env
```

2. Update these in `.env` with your own configurations

```
DISCORD_TOKEN='your discord bot token’
APPLICATION_ID=‘your application id’
LOG_CHANNEL_ID='YOUR CHANNEL ID’
MOCHI_GUILD_ID=‘YOUR GUILD ID’
```

3. Install dependencies

```
make install
```

4. Run bot

```
make dev
```

### How to work on a TODO

1. Feel free to pick any TODO for you from [\*\*Board View](https://www.notion.so/2b9be3fffef74705830ad77058e35c95) → Mochi → Backlog\*\*
2. **Assign** that item to your account
3. Remember to update item’s **status** based on your working progress
   - `Backlog`: not started yet
   - `In Progress`: still working on
   - `In Review`: Task done = PR has been merged to `develop` branch at least
   - `Completed`: Confirmation from the team that the TODO is completely finished
4. When switching your TODO to `In Review`, remember to fill these in
   ![Untitled](/assets/images/5.png)

### PR Template

```markdown
**What does this PR do?**

- [x] New command `$abc` or `/abc` to ...
- [x] Update command flow ...
- [x] Fix error ...

**How to test** (optional)
Can be replaced by **Demo** section with a demo video

**Flowchart** (optional)
Should have if the flow is complex

**Media** (Demo)
Attach images or demo videos
Can insert video URL in case the size exceeds github limit
```

## Technical Document

**1. Project structure**

All source code located under `src/`, which contains multiple modules

- `adapters/`: where all API requests are invoked
- `assets/`: static resources (fonts, images)
- `commands/`: where all bot commands are located. Most of them are divided into 5 main groups
  - `config`: mostly commands related to guild’s settings (e.g. reaction-role)
  - `defi`: crypto-related commands (crypto tracking, wallet tx, etc.)
  - `community`: set up channels and other add-ins to facilitate activities
  - `profile`: personal things (e.g. profile, verify wallet)
  - And other commands which do not belong to any group (e.g. `help.ts`)
  - `index.ts`: contains all available commands and functions to validate, authorize and route user’s input to the respective command handler
- `errors/`: custom bot errors’ handlers
- `events/`: where discord events are listened and handled (e.g. logging a text when the bot launched successfully with event `ready`
- `types/`: types’ definitions for usage across the project. There are 2 files needs to be noticed
  - `api.ts`: auto-generated file by `swagger-typescript-api`. Containing all model definitions from [mochi-api’s swagger documentation](https://develop-api.mochi.pod.town/swagger/doc.json)
  - `common.ts`: contains 2 important types `Command` (text command) and `SlashCommand`. Will go deeper in next section
- `utils`: utility methods for general usages (e.g. `composeEmbedMessage()`)

**2. Command structure**

**a. Text command (prefix `$`)**

```tsx
export type Command = {
  // unique command ID
  id: string;
  command: string;
  category: Category;
  // brief description of the command
  // this will be shown in command's help messagae
  brief: string;
  // flag to enable (true) only-admin command
  onlyAdministrator?: boolean;
  // command's handler
  run: (
    msg: Message,
    action?: string
  ) => Promise<
    | RunResult<MessageOptions>
    | MultipleResult<Message>
    | void
    | null
    | undefined
  >;
  // command's help message ($help ticker)
  getHelpMessage: (msg: Message, action?: string) => Promise<MessageOptions>;
  // command's aliases ($reactionrole = $rr)
  aliases?: string[];
  // flag to determine whether command can run without sub-command
  // e.g. reactionrole
  // $rr -> show help message because of invalid command
  // $rr list -> show list of reaction-roles
  canRunWithoutAction?: boolean;
  // can only run in admin/team channels
  experimental?: boolean;
  // list of sub-commands
  actions?: Record<string, Command>;
  // allow command to be able to used in DM
  allowDM?: boolean;
  // command's color
  colorType: ColorType;
  // number of min arguments (including the command itself)
  // e.g. $wl add eth = 3 arguments
  // if the input is lack of arguments, show help message
  minArguments?: number;
};
```

**b. Slash command (prefix `/`)**

```tsx
export type SlashCommand = {
  name: string;
  category: Category;
  onlyAdministrator?: boolean;
  // auto-complete suggestions for command's arguments
  prepare: (
    slashCommands?: Record<string, SlashCommand>
  ) =>
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    | SlashCommandSubcommandBuilder;
  run: (
    interaction: CommandInteraction
  ) => Promise<
    | RunResult<MessageOptions>
    | MultipleResult<CommandInteraction>
    | void
    | null
    | undefined
  >;
  help: (interaction: CommandInteraction) => Promise<MessageOptions>;
  // flag to determine if the response message is privately shown to user
  ephemeral?: boolean;
  colorType: ColorType;
};
```

**3. Modules references**

- [Invite tracker](https://www.notion.so/Invite-tracker-40503e89ce40437c957f1eba1c87905d)

- [Assign Role & Default Role](https://www.notion.so/Assign-Role-Default-Role-d6f6fd10722c432cb4aba8d24d47e390)

- [Server Stats](https://www.notion.so/Server-Stats-dc76616935ab414d9b99e5655fad053e)

- [Level Role](https://www.notion.so/Level-Role-842c00dd9a6a45c19c03b9e5f5a56324)

- [PoE/Twitter](https://www.notion.so/PoE-Twitter-a19c7960ca0446aa9fc1d2530a999234)

- [Verify-wallet](https://www.notion.so/Verify-wallet-9a3d511920b5416195e634f7b7092255)

- [Tip bot](https://www.notion.so/Tip-bot-634c6fe98a144d6c86d3e9d77a04b90e)

- [Quest](https://www.notion.so/Quest-4f3f9c3932c74ecc875d9750755db134)

- [Price checker](https://www.notion.so/Price-checker-4c7a9ddca67e485284451216e152be4c)

- [NFT](https://www.notion.so/NFT-bc88b0a16fb7457d9621e35ddc5cc90d)

- [NFT Role](https://www.notion.so/NFT-Role-174945895e164d65a2b0df4f262a3cb1)

## Credits

A big thank to all who contributed to this project!
![Untitled](https://contrib.rocks/image?repo=consolelabs/mochi-discord)

## Keep in touch

- Reach us at [discord](https://discord.gg/dddsYkB8Jw).
- Discuss development in the #build-with-us channel.
- [Core team members and Contributors](https://www.notion.so/3ab4b42bbc564e7b8d767521c25e78a0).
