# Code Never Stops CLI

Code on the go — control AI coding agents from your phone, browser, or terminal.

Free. Open source. Code anywhere.

## Installation

```bash
npm install -g easycoder
```

> Migrated from the `happy-coder` package. Thanks to [@franciscop](https://github.com/franciscop) for donating the `easycoder` package name!

## Usage

### Claude Code (default)

```bash
easycoder
# or
easycoder claude
```

This will:
1. Start a Claude Code session
2. Display a QR code to connect from your mobile device or browser
3. Allow real-time session control — all communication is end-to-end encrypted
4. Start new sessions directly from your phone or web while your computer is online

### More agents

```
easycoder codex
easycoder gemini
easycoder openclaw

# or any ACP-compatible CLI
easycoder acp opencode
easycoder acp -- custom-agent --flag
```

## Daemon

The daemon is a background service that stays running on your machine. It lets you spawn and manage coding sessions remotely — from your phone or the web app — without needing an open terminal.

```bash
easycoder daemon start
easycoder daemon stop
easycoder daemon status
easycoder daemon list
```

The daemon starts automatically when you run `easycoder`, so you usually don't need to manage it manually.

## Authentication

```bash
easycoder auth login
easycoder auth logout
```

Code Never Stops uses cryptographic key pairs for authentication — your private key stays on your machine. All session data is end-to-end encrypted before leaving your device.

To connect third-party agent APIs:

```bash
easycoder connect gemini
easycoder connect claude
easycoder connect codex
easycoder connect status
```

## Commands

| Command | Description |
|---------|-------------|
| `easycoder` | Start Claude Code session (default) |
| `easycoder codex` | Start Codex mode |
| `easycoder gemini` | Start Gemini CLI session |
| `easycoder openclaw` | Start OpenClaw session |
| `easycoder acp` | Start any ACP-compatible agent |
| `easycoder resume <id>` | Resume a previous session |
| `easycoder notify` | Send push notification to your devices |
| `easycoder doctor` | Diagnostics & troubleshooting |

---

## Advanced

### Environment Variables

| Variable | Description |
|----------|-------------|
| `EASYCODER_SERVER_URL` | Custom server URL (default: `https://codeapi.daima.club`) |
| `EASYCODER_WEBAPP_URL` | Custom web app URL (default: `https://code.daima.club`) |
| `EASYCODER_HOME_DIR` | Custom home directory for EasyCoder data (default: `~/.easycoder`) |
| `EASYCODER_DISABLE_CAFFEINATE` | Disable macOS sleep prevention |
| `EASYCODER_EXPERIMENTAL` | Enable experimental features |

### Sandbox (experimental)

EasyCoder can run agents inside an OS-level sandbox to restrict file system and network access.

```bash
easycoder sandbox configure
easycoder sandbox status
easycoder sandbox disable
```

### Building from source

```bash
git clone https://github.com/Jianghaiyangcc/easyCoder
cd happy-cli
yarn install
yarn workspace easycoder cli --help
```

## Requirements

- Node.js >= 20.0.0
- For Claude: `claude` CLI installed & logged in
- For Codex: `codex` CLI installed & logged in
- For Gemini: `npm install -g @google/gemini-cli` + `easycoder connect gemini`

## License

MIT
