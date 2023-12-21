## this is stage two , where the app actually runs
FROM node:18-alpine3.18

ARG SWAGGER_URL=https://api.mochi.console.so/swagger/doc.json
ENV SWAGGER_URL=$SWAGGER_URL 
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

WORKDIR /usr/src/app
RUN apk add --no-cache python3 py3-pip make build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev imagemagick

# Copy the package.json and package-lock.json files to the working directory
COPY package.json ./
COPY pnpm-lock.yaml ./
# Install the dependencies
RUN npm install -g pnpm && \
    pnpm install -P

COPY . .

CMD pnpm start
