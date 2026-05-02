# easycoder-agent

`easycoder-agent` 是一个面向自动化和脚本场景的远程控制 CLI，用于管理 EasyCoder 中的机器与会话。

与 `easycoder` 不同，`easycoder-agent` 更偏“远程控制面板”能力：列机器、起会话、发消息、查状态、恢复会话。

## 安装

```bash
npm install -g easycoder-agent
```

或在仓库根目录本地开发：

```bash
pnpm install
pnpm --filter easycoder-agent build
pnpm --filter easycoder-agent dev
```

## 认证

```bash
easycoder-agent auth login
easycoder-agent auth status
easycoder-agent auth logout
```

凭据默认存储在 `~/.easycoder/agent.key`。

## 核心命令

### 机器

```bash
easycoder-agent machines
easycoder-agent machines --active
easycoder-agent machines --json
```

### 会话列表

```bash
easycoder-agent list
easycoder-agent list --active
easycoder-agent list --json
```

### 在指定机器上启动会话

```bash
easycoder-agent spawn --machine <machine-id> --path ~/project
easycoder-agent spawn --machine <machine-id> --path ~/project --agent codex
easycoder-agent spawn --machine <machine-id> --path ~/new-project --create-dir
easycoder-agent spawn --machine <machine-id> --path ~/project --json
```

支持 Agent：`claude` / `codex` / `gemini` / `openclaw`。

### 恢复会话

```bash
easycoder-agent resume <session-id>
easycoder-agent resume <session-id> --json
```

### 会话状态与消息

```bash
easycoder-agent status <session-id>
easycoder-agent status <session-id> --json

easycoder-agent history <session-id>
easycoder-agent history <session-id> --limit 20
easycoder-agent history <session-id> --json
```

### 创建 / 发送 / 停止 / 等待

```bash
easycoder-agent create --tag my-project --path ~/project
easycoder-agent create --tag my-project --json

easycoder-agent send <session-id> "Fix login bug"
easycoder-agent send <session-id> "Run tests" --wait
easycoder-agent send <session-id> "Ship it" --yolo
easycoder-agent send <session-id> "Hello" --json

easycoder-agent stop <session-id>

easycoder-agent wait <session-id>
easycoder-agent wait <session-id> --timeout 60
```

## ID 前缀匹配

`<session-id>` 和 `<machine-id>` 支持前缀匹配（例如只传前几位）。

## 环境变量

- `EASYCODER_SERVER_URL`：服务端地址（默认 `https://codeapi.daima.club`）
- `EASYCODER_HOME_DIR`：本地数据目录（默认 `~/.easycoder`）

## 运行要求

- Node.js >= 20
- 可用的 EasyCoder 账号（用于二维码认证）

## License

MIT
