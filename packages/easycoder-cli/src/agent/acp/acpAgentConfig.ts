export type AcpAgentConfig = {
  command: string;
  args: string[];
};

export const KNOWN_ACP_AGENTS: Record<string, AcpAgentConfig> = {
  gemini: { command: 'gemini', args: ['--experimental-acp'] },
  opencode: { command: 'opencode', args: ['acp'] },
};

export type ResolvedAcpAgentConfig = {
  agentName: string;
  command: string;
  args: string[];
};

export function resolveAcpAgentConfig(cliArgs: string[]): ResolvedAcpAgentConfig {
  if (cliArgs.length === 0) {
    throw new Error('Usage: easycoder acp <agent-name> or easycoder acp -- <command> [args]');
  }

  if (cliArgs[0] === '--') {
    const command = cliArgs[1];
    if (!command) {
      throw new Error('Missing command after "--". Usage: easycoder acp -- <command> [args]');
    }
    return {
      agentName: command,
      command,
      args: cliArgs.slice(2),
    };
  }

  const agentName = cliArgs[0];
  const known = KNOWN_ACP_AGENTS[agentName];
  if (known) {
    const passthroughArgs: string[] = [];
    for (let i = 1; i < cliArgs.length; i++) {
      const arg = cliArgs[i];

      // Backward-compatible with old OpenCode docs/flags.
      if (agentName === 'opencode' && arg === '--acp') {
        continue;
      }

      // EasyCoder internal flag for first-party agents; ACP providers should not receive it.
      if (arg === '--easycoder-starting-mode') {
        i++;
        continue;
      }

      if (arg.startsWith('--easycoder-starting-mode=')) {
        continue;
      }

      passthroughArgs.push(arg);
    }

    return {
      agentName,
      command: known.command,
      args: [...known.args, ...passthroughArgs],
    };
  }

  return {
    agentName,
    command: agentName,
    args: cliArgs.slice(1),
  };
}
