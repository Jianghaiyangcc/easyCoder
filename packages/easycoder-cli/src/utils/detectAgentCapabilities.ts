import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import type { AgentCapabilities, AgentCapabilityOption } from '@/api/types';
import { logger } from '@/ui/logger';
import { detectCLIAvailability, type CLIAvailability } from './detectCLI';

const execFileAsync = promisify(execFile);

const DEFAULT_TIMEOUT_MS = 4_000;
const DEFAULT_MAX_BUFFER = 512 * 1024;

export const AGENT_CAPABILITY_PROBE_INTERVAL_MS = 10 * 60 * 1000;

type AgentName = 'claude' | 'codex' | 'gemini' | 'openclaw' | 'opencode';

type ProbeCommand = {
  command: string;
  args: string[];
};

const PROBE_COMMANDS: Record<AgentName, ProbeCommand[]> = {
  claude: [
    { command: 'claude', args: ['--help'] },
  ],
  codex: [
    { command: 'codex', args: ['models'] },
    { command: 'codex', args: ['model', 'list'] },
    { command: 'codex', args: ['--help'] },
  ],
  gemini: [
    { command: 'gemini', args: ['models', 'list'] },
    { command: 'gemini', args: ['model', 'list'] },
    { command: 'gemini', args: ['--help'] },
  ],
  openclaw: [
    { command: 'openclaw', args: ['models'] },
    { command: 'openclaw', args: ['model', 'list'] },
    { command: 'openclaw', args: ['--help'] },
  ],
  opencode: [
    { command: 'opencode', args: ['models'] },
    { command: 'opencode', args: ['model', 'list'] },
    { command: 'opencode', args: ['--help'] },
  ],
};

function extractUnique(text: string, regex: RegExp): string[] {
  const output: string[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(text)) !== null) {
    const raw = (match[0] ?? '').trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(raw);
  }
  return output;
}

function toOptions(models: string[]): AgentCapabilityOption[] {
  return models.map((model) => ({ code: model, value: model, description: null }));
}

function extractClaudeModels(text: string): string[] {
  const explicitModels = extractUnique(text, /claude-(?:opus|sonnet|haiku)[a-z0-9.-]*/gi);
  const shortNames = extractUnique(text, /\b(?:opus|sonnet|haiku)\b/gi).map((item) => item.toLowerCase());
  const combined = [...explicitModels, ...shortNames];
  return extractUnique(combined.join('\n'), /[a-z0-9.-]+/gi);
}

function extractCodexModels(text: string): string[] {
  return extractUnique(text, /gpt-[a-z0-9.-]+/gi);
}

function extractGeminiModels(text: string): string[] {
  return extractUnique(text, /gemini-[a-z0-9.-]+/gi);
}

function extractProviderModels(text: string): string[] {
  return extractUnique(
    text,
    /(gpt-[a-z0-9.-]+|claude-[a-z0-9.-]+|gemini-[a-z0-9.-]+|qwen[-/][a-z0-9.-]+|deepseek[-/][a-z0-9.-]+)/gi,
  );
}

function extractModelsForAgent(agent: AgentName, text: string): string[] {
  if (agent === 'claude') return extractClaudeModels(text);
  if (agent === 'codex') return extractCodexModels(text);
  if (agent === 'gemini') return extractGeminiModels(text);
  return extractProviderModels(text);
}

async function runProbeCommand(cmd: ProbeCommand, timeoutMs: number): Promise<string | null> {
  try {
    const { stdout, stderr } = await execFileAsync(cmd.command, cmd.args, {
      timeout: timeoutMs,
      maxBuffer: DEFAULT_MAX_BUFFER,
      windowsHide: true,
    });
    const output = `${stdout || ''}\n${stderr || ''}`.trim();
    return output.length > 0 ? output : null;
  } catch (error: any) {
    const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
    const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
    const output = `${stdout}\n${stderr}`.trim();
    if (output.length > 0) {
      return output;
    }
    return null;
  }
}

async function probeAgentModels(agent: AgentName, timeoutMs: number): Promise<AgentCapabilityOption[] | null> {
  const commands = PROBE_COMMANDS[agent];

  for (const cmd of commands) {
    const output = await runProbeCommand(cmd, timeoutMs);
    if (!output) {
      continue;
    }

    const models = extractModelsForAgent(agent, output);
    if (models.length > 0) {
      logger.debug(`[CAPABILITY PROBE] ${agent}: detected ${models.length} models via ${cmd.command} ${cmd.args.join(' ')}`);
      return toOptions(models);
    }
  }

  logger.debug(`[CAPABILITY PROBE] ${agent}: no model list detected`);
  return null;
}

export async function detectAgentCapabilities(opts?: {
  availability?: CLIAvailability;
  timeoutMs?: number;
}): Promise<AgentCapabilities> {
  const availability = opts?.availability ?? detectCLIAvailability();
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const detectedAt = Date.now();

  const capabilities: AgentCapabilities = {};

  const agents: AgentName[] = ['claude', 'codex', 'gemini', 'openclaw', 'opencode'];
  for (const agent of agents) {
    if (!availability[agent]) {
      continue;
    }

    try {
      const models = await probeAgentModels(agent, timeoutMs);
      if (!models || models.length === 0) {
        continue;
      }

      capabilities[agent] = {
        models,
        detectedAt,
        source: 'probe',
      };
    } catch (error) {
      logger.debug(`[CAPABILITY PROBE] ${agent}: probe failed`, error);
    }
  }

  return capabilities;
}

export function agentCapabilitiesEqual(a: AgentCapabilities | null | undefined, b: AgentCapabilities | null | undefined): boolean {
  const left = a ?? {};
  const right = b ?? {};
  return JSON.stringify(left) === JSON.stringify(right);
}
