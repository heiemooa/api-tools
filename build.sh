# 定义环境变量（可以在 .env 文件中设置，或者直接在命令行中设置）
export SSH_PRIVATE_KEY=$(cat ~/.ssh/id_rsa)
export SSH_KNOWN_HOSTS=$(cat ~/.ssh/known_hosts)

# 使用 build-arg 构建镜像
docker build \
  --build-arg SSH_PRIVATE_KEY="$SSH_PRIVATE_KEY" \
  --build-arg SSH_KNOWN_HOSTS="$SSH_KNOWN_HOSTS" \
  -t api-tools .