import Queue from "."

export let kafkaQueue: Queue
export const assignKafka = (k: Queue) => (kafkaQueue = k)
