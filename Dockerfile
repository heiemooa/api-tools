FROM node:lts-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN apk add --no-cache gcompat && yarn install --profer-offline

FROM deps AS builder
WORKDIR /app
RUN yarn
COPY . .
RUN yarn run build

FROM alpine AS runner
WORKDIR /app
RUN apk add --no-cache libstdc++ dumb-init \
  && addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node \
  && chown node:node ./
COPY --from=builder /usr/local/bin/node /usr/local/bin/
COPY --from=builder /usr/local/bin/docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["docker-entrypoint.sh"]
USER node

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

ENV HOST 127.0.0.1
ENV PORT 5555
ENV NODE_ENV production
ENV ALLOW_SCHEDULE true

EXPOSE 5555
CMD dumb-init node ./build/index.js