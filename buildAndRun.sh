#!/bin/bash

export DATABASE_URL='postgresql://postgres:postgres@is-postgres:5432/easycoder?schema=public'
export HANDY_MASTER_SECRET='dfasdlfjklsfjlasdflwjferj23723740234'

docker stop easycoder-webapp
docker stop easycoder-server
docker rm easycoder-webapp
docker rm easycoder-server

set -euo pipefail

: "${DATABASE_URL:?set DATABASE_URL}"
: "${HANDY_MASTER_SECRET:?set HANDY_MASTER_SECRET}"


docker build -f Dockerfile.server -t registry.cn-shanghai.aliyuncs.com/easycoder/easycoder-server:1.0.0 .
docker build -f Dockerfile.webapp \
  --build-arg EXPO_PUBLIC_SERVER_URL="http://localhost:3005" \
  --build-arg EXPO_PUBLIC_EASYCODER_SERVER_URL="http://localhost:3005" \
  -t registry.cn-shanghai.aliyuncs.com/easycoder/easycoder-app:1.0.0 .

docker push registry.cn-shanghai.aliyuncs.com/easycoder/easycoder-app:1.0.0
docker push registry.cn-shanghai.aliyuncs.com/easycoder/easycoder-server:1.0.0

# 先跑迁移（生产很重要）
docker run --rm --network nw-insight \
  -e "DATABASE_URL=${DATABASE_URL}" \
  registry.cn-shanghai.aliyuncs.com/easycoder/easycoder-server:1.0.0 \
  sh -lc 'cd /repo && npx prisma migrate deploy --schema=packages/easycoder-server/prisma/schema.prisma'

 # 起后端服务
docker run -d --name easycoder-server --network nw-insight -p 3005:3005 \
  -e PORT=3005 \
  -e "HANDY_MASTER_SECRET=${HANDY_MASTER_SECRET}" \
  -e "DATABASE_URL=${DATABASE_URL}" \
  --env-file ./packages/easycoder-server/.env.pro \
  registry.cn-shanghai.aliyuncs.com/easycoder/easycoder-server:1.0.0 

# 启动前端容器（nginx）
docker run -d --name easycoder-webapp -p 20080:80 \
  registry.cn-shanghai.aliyuncs.com/easycoder/easycoder-app:1.0.0
