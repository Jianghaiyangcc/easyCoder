import { homedir } from 'node:os';
import { join } from 'node:path';

export type Config = {
    serverUrl: string;
    homeDir: string;
    credentialPath: string;
};

export function loadConfig(): Config {
    const serverUrl = (process.env.EASYCODER_SERVER_URL ?? 'https://codeapi.daima.club').replace(/\/+$/, '');
    const homeDir = process.env.EASYCODER_HOME_DIR ?? join(homedir(), '.easycoder');
    const credentialPath = join(homeDir, 'agent.key');
    return { serverUrl, homeDir, credentialPath };
}
