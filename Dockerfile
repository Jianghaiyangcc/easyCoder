# Standalone happy-server: single container, no external dependencies
# Uses PGlite (embedded Postgres), local filesystem storage, no Redis

# Stage 1: install dependencies
FROM node:20 AS deps

RUN apt-get update && apt-get install -y python3 make g++ build-essential && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY scripts ./scripts
COPY patches ./patches

RUN mkdir -p packages/easycoder-app packages/easycoder-server packages/easycoder-cli packages/easycoder-agent packages/easycoder-wire

COPY packages/easycoder-app/package.json packages/easycoder-app/
COPY packages/easycoder-server/package.json packages/easycoder-server/
COPY packages/easycoder-cli/package.json packages/easycoder-cli/
COPY packages/easycoder-agent/package.json packages/easycoder-agent/
COPY packages/easycoder-wire/package.json packages/easycoder-wire/

# Workspace postinstall requirements
COPY packages/easycoder-app/patches packages/easycoder-app/patches
COPY packages/easycoder-server/prisma packages/easycoder-server/prisma
COPY packages/easycoder-cli/scripts packages/easycoder-cli/scripts
COPY packages/easycoder-cli/tools packages/easycoder-cli/tools

RUN SKIP_EASYCODER_WIRE_BUILD=1 pnpm install --frozen-lockfile

# Stage 2: copy source and type-check
FROM deps AS builder

COPY packages/easycoder-wire ./packages/easycoder-wire
COPY packages/easycoder-server ./packages/easycoder-server

RUN pnpm --filter @easycoder/wire build
RUN pnpm --filter happy-server build

# Stage 3: runtime
FROM node:20-slim AS runner

WORKDIR /repo

RUN apt-get update && apt-get install -y ffmpeg curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PGLITE_DIR=/data/pglite

COPY --from=builder /repo/node_modules /repo/node_modules
COPY --from=builder /repo/packages/easycoder-wire /repo/packages/easycoder-wire
COPY --from=builder /repo/packages/easycoder-server /repo/packages/easycoder-server

VOLUME /data
EXPOSE 3005

WORKDIR /repo/packages/easycoder-server

CMD ["sh", "-c", "../../node_modules/.bin/tsx sources/standalone.ts migrate && exec ../../node_modules/.bin/tsx sources/standalone.ts serve"]
