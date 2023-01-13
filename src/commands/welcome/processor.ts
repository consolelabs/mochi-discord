export function parseWelcomeMessage(msg: string) {
  return msg.replaceAll(`\\n`, "\n")
}
