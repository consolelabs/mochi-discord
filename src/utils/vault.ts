import { getEmoji } from "utils/common"
export function listSubmissionVault(submission: []) {
  let listSubmissionValue = ""
  submission.forEach((item: any) => {
    const quote = `<@${item.submitter}> has ${item.status} the request.\n`
    if (item.status === "approved") {
      listSubmissionValue += `${getEmoji("CHECK")} ${quote}`
    } else if (item.status === "rejected") {
      listSubmissionValue += `${getEmoji("REVOKE")} ${quote}`
    }
  })
  return listSubmissionValue
}
