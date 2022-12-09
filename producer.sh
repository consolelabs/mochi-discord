#! /bin/bash

topic=$1
message=$2

# Run the TypeScript file
npx tsx src/producer.ts "$topic" "$message"