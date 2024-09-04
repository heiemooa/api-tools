#!/usr/bin/env ash

# 定义环境变量（可以在 .env 文件中设置，或者直接在命令行中设置）
export SSH_PRIVATE_KEY=$(cat ~/.ssh/id_rsa)
export SSH_KNOWN_HOSTS=$(cat ~/.ssh/known_hosts)

export GIT_USER_NAME=$(git config --global user.name)
export GIT_USER_EMAIL=$(git config --global user.email)

# 构建镜像
docker run \
  -e SSH_PRIVATE_KEY="$SSH_PRIVATE_KEY" \
  -e SSH_KNOWN_HOSTS="$SSH_KNOWN_HOSTS" \
  -e GIT_USER_NAME="$GIT_USER_NAME" \
  -e GIT_USER_EMAIL="$GIT_USER_EMAIL" \
  -p 5555:5555 \
  --name api-tools api-tools