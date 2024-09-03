# Stage 1: Install dependencies
FROM node:lts-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN apk add --no-cache gcompat git && yarn install --prefer-offline

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

RUN apk add --no-cache libstdc++ dumb-init git openssh-client \
  && addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node \
  && chown -R node:node ./

# Copy SSH key and configure known_hosts (Ensure to add SSH private key securely during build)
# 创建 .ssh 目录并设置权限
RUN mkdir -p /home/node/.ssh && \
    chmod 700 /home/node/.ssh
    
# 接收 build-args
ARG SSH_PRIVATE_KEY
ARG SSH_KNOWN_HOSTS

# 将 SSH 密钥写入容器中的文件
RUN echo "$SSH_PRIVATE_KEY" > /home/node/.ssh/id_rsa && \
    echo "$SSH_KNOWN_HOSTS" > /home/node/.ssh/known_hosts && \
    chmod 600 /home/node/.ssh/id_rsa && \
    chmod 644 /home/node/.ssh/known_hosts
  
ENTRYPOINT ["docker-entrypoint.sh"]
USER node

ENV HOST 0.0.0.0
ENV PORT 5555
ENV NODE_ENV production
ENV ALLOW_SCHEDULE true

EXPOSE 5555
CMD dumb-init node ./build/index.js