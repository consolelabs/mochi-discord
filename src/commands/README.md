# Command guideline

## General

Whenever you create a new command or fine-tune existing ones, some rules must apply:

- Every embed should use `author` and not the `title` property
- Every command ouput except for help messages or error messages must include a header
- Body must be an embed message
- Wrap callbacks in `wrapError`

![overview](../../assets/images/components.png)

### Section

A section = header + subheader (if any) + content, use `composeSection()` to do this

### Footer

- With user avatar for personalized feedback
  `<avatar> <random_tip> • Mochi Bot • <timestamp>`

### Description/Empty view

![description](../../assets/images/description_empty_view.png)

### Message components

- Include CTA buttons/selects to guide user through commands
- Include back button when viewing nested content

  E.g. /profile -> view wallet -> back to /profile

![description](../../assets/images/dropdown.png)

## Success/Error

A ok/failed message response must have the following properties to be considered standard:

- If success, the color is BLUE `#34AAFF`
- If it is error 500 from backend, the color is RED `#D94F4F`
- If it is user error, the color is GRAY `#1E1F22`

The `composeEmbedMessage()` utility function can be used to quickly build an embed message
