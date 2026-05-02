<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/.github/logotype-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="/.github/logotype-light.png">
    <img src="/.github/logotype-dark.png" width="400" alt="码不停蹄 EasyCoder">
  </picture>
</div>

<h1 align="center">码不停蹄 · EasyCoder</h1>

<h4 align="center">随时随地远程使用 Claude Code / Codex / Gemini / OpenClaw</h4>

<div align="center">


[🌐 Web](https://code.daima.club) •
[📚 文档](https://code.daima.club/docs/) •


</div>


## 什么是 EasyCoder？

EasyCoder（码不停蹄）让你在手机、浏览器和电脑之间无缝切换，远程控制本机上的 AI 编码会话。
核心通信默认采用端到端加密，兼顾可用性与安全性。

## 3 分钟快速开始

### 1) 安装客户端

- Android：上方商店链接
- Web: <https://code.daima.club>

### 2) 在电脑安装 CLI

```bash
npm install -g easycoder-cli
```
### 3) 登录并启动后台服务（推荐）

```bash
easycoder auth login
easycoder daemon start
easycoder daemon status
```

### 4) 启动你的编码会话

```bash
# Claude Code（默认）
easycoder
# 或
easycoder claude

# 其他 Agent
easycoder codex
easycoder gemini
easycoder openclaw
```

## 常见问题

### 绑定成功但 Select Machine 看不到设备

通常是 daemon 未运行，执行：

```bash
easycoder daemon start
easycoder daemon status
```

然后回到 App 刷新机器列表。

## 为什么使用码不停蹄？

- 移动端远程查看与接管 AI 编码会话
- 需要确认或授权时可及时通知与处理
- 手机与电脑可快速切换控制权
- 统一支持多种 Agent（Claude / Codex / Gemini / OpenClaw）
- 开源可审计，可自建与二次开发

## 仓库结构

- [`packages/easycoder-app`](packages/easycoder-app) - 移动端与 Web 客户端（Expo）
- [`packages/easycoder-cli`](packages/easycoder-cli) - 本地 CLI 与 daemon
- [`packages/easycoder-agent`](packages/easycoder-agent) - 远程控制 Agent 的独立 CLI
- [`packages/easycoder-server`](packages/easycoder-server) - 后端服务与 API
- [`packages/easycoder-wire`](packages/easycoder-wire) - 协议与共享类型定义

## 本地开发（Monorepo）

```bash
pnpm install
pnpm env:up
```

常用命令：

```bash
pnpm env:server
pnpm env:web
pnpm env:cli
```

## 文档与贡献

- 文档目录：[`docs/`](docs/)
- 贡献指南：[`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)

欢迎提交 Issue 与 PR，一起把远程 AI 编码体验做得更好。

## License

MIT - 详见 [LICENSE](LICENSE)
