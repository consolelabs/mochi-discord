## this is stage two , where the app actually runs
FROM node:16.9.0-alpine

WORKDIR /usr/src/app
RUN apk add --no-cache python3 py3-pip make build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev imagemagick
RUN apk add --update  --repository http://dl-3.alpinelinux.org/alpine/edge/testing libmount ttf-dejavu ttf-droid ttf-freefont ttf-liberation ttf-ubuntu-font-family fontconfig

COPY . .
RUN yarn

CMD yarn start
