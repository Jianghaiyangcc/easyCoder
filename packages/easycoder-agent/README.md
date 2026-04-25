# Code Never Stops Agent

CLI client for controlling Code Never Stops agents remotely.

Unlike `happy-cli` which both runs and controls agents, `easycoder-agent` only controls them — listing machines, spawning sessions on a machine, creating sessions, sending messages, reading history, monitoring state, and stopping sessions.

## Installation

From the monorepo:

```bash
yarn workspace easycoder-agent build
```

Or link globally:

```bash
cd packages/happy-agent && npm link
```

## Authentication

Code Never Stops Agent uses account authentication via QR code, the same flow as linking a device in the Code Never Stops mobile app.

```bash
# Authenticate by scanning QR code with the EasyCoder mobile app
easycoder-agent auth login

# Check authentication status
easycoder-agent auth status

# Clear stored credentials
easycoder-agent auth logout
```

Credentials are stored at `~/.easycoder/agent.key`.

## Commands

### List sessions

```bash
# List all sessions
easycoder-agent list

# List only active sessions
easycoder-agent list --active

# Output as JSON
easycoder-agent list --json
```

### List machines

```bash
# List all machines
easycoder-agent machines

# List only active machines
easycoder-agent machines --active

# Output as JSON
easycoder-agent machines --json
```

### Spawn on a machine

```bash
# Spawn a session on a specific machine
easycoder-agent spawn --machine <machine-id> --path ~/project

# Let the daemon create the directory if needed
easycoder-agent spawn --machine <machine-id> --path ~/new-project --create-dir

# Choose a specific agent
easycoder-agent spawn --machine <machine-id> --path ~/project --agent codex

# Output as JSON
easycoder-agent spawn --machine <machine-id> --path ~/project --json
```

### Session status

```bash
# Get live session state (supports ID prefix matching)
easycoder-agent status <session-id>

# Output as JSON
easycoder-agent status <session-id> --json
```

### Create a session

```bash
# Create a new session with a tag
easycoder-agent create --tag my-project

# Specify a working directory
easycoder-agent create --tag my-project --path /home/user/project

# Output as JSON
easycoder-agent create --tag my-project --json
```

### Send a message

```bash
# Send a message to a session
easycoder-agent send <session-id> "Fix the login bug"

# Send with yolo permissions
easycoder-agent send <session-id> "Ship it" --yolo

# Send and wait for the agent to finish
easycoder-agent send <session-id> "Run the tests" --wait

# Output as JSON
easycoder-agent send <session-id> "Hello" --json
```

### Message history

```bash
# View message history
easycoder-agent history <session-id>

# Limit to last N messages
easycoder-agent history <session-id> --limit 10

# Output as JSON
easycoder-agent history <session-id> --json
```

### Stop a session

```bash
easycoder-agent stop <session-id>
```

### Wait for idle

```bash
# Wait for agent to become idle (default 300s timeout)
easycoder-agent wait <session-id>

# Custom timeout
easycoder-agent wait <session-id> --timeout 60
```

Exit code 0 when agent becomes idle, 1 on timeout.

## Environment Variables

- `EASYCODER_SERVER_URL` - API server URL (default: `https://codeapi.daima.club`)
- `EASYCODER_HOME_DIR` - Home directory for credential storage (default: `~/.easycoder`)

## Session ID Matching

All commands that accept a `<session-id>` support prefix matching. You can provide the first few characters of a session ID and the CLI will resolve the full ID.

Machine-aware commands such as `spawn --machine <machine-id>` also support ID prefix matching.

## Encryption

All machine and session data is end-to-end encrypted. New records use AES-256-GCM with per-record keys. Existing records created by other clients are decrypted using the appropriate key scheme (AES-256-GCM or legacy NaCl secretbox).

## Requirements

- Node.js >= 20.0.0
- A EasyCoder mobile app account for authentication

## Publishing to npm

Maintainers can publish a new version:

```bash
yarn release               # From repo root: choose library to release
# or directly:
yarn workspace easycoder-agent release
```

This flow:
- runs tests/build checks via `prepublishOnly`
- creates a release commit and `happy-agent-vX.Y.Z` tag
- creates a GitHub release with generated notes
- publishes `easycoder-agent` to npm

## License

MIT
