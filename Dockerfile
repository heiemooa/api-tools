# Stage 1: Install dependencies
FROM node:lts-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN apk add --no-cache gcompat git yarn && yarn install --prefer-offline

# Stage 2: Build the application
FROM deps AS builder
WORKDIR /app
RUN yarn
COPY . .
RUN yarn run build

# Stage 3: Run the application
FROM alpine AS runner
WORKDIR /app

COPY --from=builder /usr/local/bin/node /usr/local/bin/
COPY --from=builder /usr/local/bin/docker-entrypoint.sh /usr/local/bin/

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

RUN apk add --no-cache libstdc++ dumb-init git yarn openssh-client \
  && addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node \
  && chown -R node:node ./

COPY entrypoint.sh entrypoint.sh
RUN  chmod +x entrypoint.sh
    
ENTRYPOINT ["docker-entrypoint.sh"]
USER node

ENV HOST 0.0.0.0
ENV PORT 5555
ENV NODE_ENV production
ENV ALLOW_SCHEDULE true

EXPOSE 5555
CMD ./entrypoint.sh && dumb-init node ./build/index.js