import Queue from "utils/Queue"

export let kafkaQueue: Queue
export const assignKafka = (k: Queue) => (kafkaQueue = k)
