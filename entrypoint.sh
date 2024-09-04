#!/usr/bin/env ash

# 创建 .ssh 目录并设置权限
mkdir -p $HOME/.ssh
chmod 700 $HOME/.ssh

# 将 SSH 私钥和 known_hosts 写入文件
echo "$SSH_PRIVATE_KEY" > $HOME/.ssh/id_rsa
echo "$SSH_KNOWN_HOSTS" > $HOME/.ssh/known_hosts

# 设置权限
chmod 600 $HOME/.ssh/id_rsa
chmod 644 $HOME/.ssh/known_hosts

# 设置 Git 用户信息
git config --global user.name "$GIT_USER_NAME"
git config --global user.email "$GIT_USER_EMAIL"
