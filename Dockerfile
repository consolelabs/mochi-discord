## this is stage two , where the app actually runs
FROM node:16.14.0-alpine

ARG SWAGGER_URL=https://api.mochi.pod.town/swagger/doc.json
ENV SWAGGER_URL=$SWAGGER_URL 

WORKDIR /usr/src/app
RUN apk add --no-cache python3 py3-pip make build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev imagemagick

COPY . .
RUN yarn
RUN yarn generate:types

CMD yarn start
