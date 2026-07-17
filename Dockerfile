## this is stage two , where the app actually runs
FROM node:18-alpine3.18

ARG SWAGGER_URL=https://api.mochi.console.so/swagger/doc.json
ENV SWAGGER_URL=$SWAGGER_URL 
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

WORKDIR /usr/src/app
RUN apk add --no-cache python3 py3-pip make build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev imagemagick
RUN apk add font-terminus font-inconsolata font-dejavu font-noto font-noto-cjk font-awesome font-noto-extra

# Copy the package.json and package-lock.json files to the working directory
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install the dependencies
# Pin pnpm to 9.x: pnpm 11 dropped Node <22.13, but this image is node:18, and the
# lockfile is lockfileVersion 9.0. Unpinned `pnpm` broke every prod build after pnpm@11 shipped.
RUN npm install -g pnpm@9 && \
    pnpm install -P && \
    pnpm up '@consolelabs/*' --latest

# Hotfix for mochi-formatter <=20.0.11: a stray space in the mochi() profile
# renderer URL breaks Discord masked links (raw "[label](url)" shows in embeds).
# Fixed upstream in consolelabs/mochi.js#47; no-op once formatter >=20.0.12 is
# on npm (npm publish pending, single maintainer), then delete these two lines.
RUN sed -i 's|${HOMEPAGE} /profile/|${HOMEPAGE}/profile/|g' \
    node_modules/@consolelabs/mochi-formatter/dist/index.js \
    node_modules/@consolelabs/mochi-formatter/dist/index.mjs

# Rebuild canvas bindings
RUN cd node_modules/canvas && \
    npm rebuild canvas

COPY . .

CMD pnpm start
