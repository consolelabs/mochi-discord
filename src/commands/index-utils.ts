// function to check cmd to such as $nr, $nr set to help cmd
export function isAcceptableCmdToHelp(
  cmd: string,
  aliases: string[],
  action: string,
  msg: string
) {
  let lstCmd = [`$` + cmd]
  if (aliases) {
    lstCmd = lstCmd.concat(aliases.map((v) => `$` + v))
  }
  if (action) {
    lstCmd = lstCmd.concat(lstCmd.map((v) => v + " " + action))
  }
  return lstCmd.includes(msg.split(/ +/g).join(" "))
}
