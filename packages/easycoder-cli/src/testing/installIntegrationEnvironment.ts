import { afterAll } from 'vitest';
import {
    applyEnvironmentToProcess,
    createIntegrationEnvironment,
    destroyIntegrationEnvironment,
    type EnvironmentTemplate,
    type IntegrationEnvironment,
} from './integrationEnvironment';

type IntegrationEnvironmentProfile = {
    template: EnvironmentTemplate;
    up: boolean;
};

declare global {
    // eslint-disable-next-line no-var
    var __easycoderIntegrationEnv: IntegrationEnvironment | undefined;
}

export async function installIntegrationEnvironment(profile: IntegrationEnvironmentProfile) {
    const previousEnv = {
        EASYCODER_SERVER_URL: process.env.EASYCODER_SERVER_URL,
        EASYCODER_WEBAPP_URL: process.env.EASYCODER_WEBAPP_URL,
        EASYCODER_HOME_DIR: process.env.EASYCODER_HOME_DIR,
        EASYCODER_PROJECT_DIR: process.env.EASYCODER_PROJECT_DIR,
        EASYCODER_VARIANT: process.env.EASYCODER_VARIANT,
        DEBUG: process.env.DEBUG,
    };

    const env = await createIntegrationEnvironment(profile);
    applyEnvironmentToProcess(env);
    globalThis.__easycoderIntegrationEnv = env;

    afterAll(async () => {
        try {
            await destroyIntegrationEnvironment(env);
        } finally {
            for (const [key, value] of Object.entries(previousEnv)) {
                if (value === undefined) {
                    delete process.env[key];
                } else {
                    process.env[key] = value;
                }
            }

            if (globalThis.__easycoderIntegrationEnv?.name === env.name) {
                globalThis.__easycoderIntegrationEnv = undefined;
            }
        }
    });
}
