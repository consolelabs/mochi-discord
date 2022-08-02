import { initializeApp, cert } from "firebase-admin/app"
import { Firestore, getFirestore } from "firebase-admin/firestore"
import { logger } from "logger"
import serviceAccount from "../../firebase-key.json"
import { FIRESTORE_KEY } from "../env"

let firestore: Firestore

if (!FIRESTORE_KEY) {
  logger.warn(
    "Firestore - private key not found, session data will be lost via restarts"
  )
} else if (!firestore) {
  initializeApp({
    credential: cert({
      ...serviceAccount,
      privateKey: FIRESTORE_KEY.replaceAll("\\n", "\n"),
    }),
  })
  logger.info("Firestore - init OK")
  firestore = getFirestore()
}

export { firestore }
