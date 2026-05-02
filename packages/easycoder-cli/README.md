# EasyCoder CLI

EasyCoder CLI 是在本机运行 AI 编码会话的统一入口，支持 Claude Code、Codex、Gemini、OpenClaw，并可与移动端 / Web 端联动远程控制。

## 安装

```bash
npm install -g easycoder
```

> 历史包名为 `happy-coder`，当前统一使用 `easycoder`。

## 快速开始

1) 登录账号

```bash
easycoder auth login
```

2) 启动后台 daemon（推荐）

```bash
easycoder daemon start
easycoder daemon status
```

3) 启动会话

```bash
# Claude（默认）
easycoder
# 或
easycoder claude

# 其他 Agent
easycoder codex
easycoder gemini
easycoder openclaw
```

## 常用命令

```bash
# 认证
easycoder auth login
easycoder auth status
easycoder auth logout

# daemon
easycoder daemon start
easycoder daemon stop
easycoder daemon status
easycoder daemon list

# 账号连接（第三方 Provider）
easycoder connect claude
easycoder connect codex
easycoder connect gemini
easycoder connect status

# 诊断和恢复
easycoder doctor
easycoder resume <session-id>
```

## 常见问题

### 绑定成功，但 App 的机器列表看不到当前电脑

通常是 daemon 未运行：

```bash
easycoder daemon start
easycoder daemon status
```

确认 daemon 在线后，回到 App 刷新机器列表。

## 环境变量

| 变量名 | 说明 |
|---|---|
| `EASYCODER_SERVER_URL` | 自定义服务端地址（默认 `https://codeapi.daima.club`） |
| `EASYCODER_WEBAPP_URL` | 自定义 Web 地址（默认 `https://code.daima.club`） |
| `EASYCODER_HOME_DIR` | 本地数据目录（默认 `~/.easycoder`） |
| `EASYCODER_DISABLE_CAFFEINATE` | 关闭 macOS 防休眠 |
| `EASYCODER_EXPERIMENTAL` | 启用实验功能 |

## 从源码开发

在仓库根目录：

```bash
pnpm install
pnpm --filter easycoder-cli build
pnpm --filter easycoder-cli dev
```

## 运行要求

- Node.js >= 20
- 使用 Claude 时需要本机已安装并登录 `claude`
- 使用 Codex 时需要本机已安装并登录 `codex`
- 使用 Gemini 时建议先连接账号：`easycoder connect gemini`

## License

MIT
