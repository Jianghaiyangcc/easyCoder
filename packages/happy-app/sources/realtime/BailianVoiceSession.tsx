import React, { useEffect, useRef } from 'react';
import { createAudioPlayer, RecordingPresets, useAudioRecorder, type AudioPlayer, type AudioRecorder } from 'expo-audio';
import { File } from 'expo-file-system';
import { registerVoiceSession } from './RealtimeSession';
import { storage } from '@/sync/storage';
import { sync } from '@/sync/sync';
import { TokenStorage } from '@/auth/tokenStorage';
import { encodeBase64 } from '@/encryption/base64';
import { fetchBailianTts, transcribeBailianAudio } from '@/sync/apiVoice';
import type { Message } from '@/sync/typesMessage';
import type { VoiceSession, VoiceSessionConfig } from './types';

interface PendingReady {
    sessionId: string;
    resolve: () => void;
}

interface BailianRuntime {
    recorder: AudioRecorder;
    startRecording: () => Promise<void>;
    stopRecordingAndTranscribe: () => Promise<string | null>;
    playTtsText: (text: string) => Promise<void>;
    getLatestAssistantText: (sessionId: string, since: number) => string | null;
}

let runtime: BailianRuntime | null = null;
let currentSessionId: string | null = null;
let pendingReady: PendingReady | null = null;
let currentPlayer: AudioPlayer | null = null;

function cleanupPlayer() {
    if (!currentPlayer) {
        return;
    }
    try {
        currentPlayer.pause();
        currentPlayer.remove();
    } catch {
        // no-op
    }
    currentPlayer = null;
}

function waitForSessionReady(sessionId: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
        pendingReady = {
            sessionId,
            resolve: () => {
                pendingReady = null;
                resolve();
            },
        };

        setTimeout(() => {
            if (pendingReady?.sessionId === sessionId) {
                pendingReady = null;
                resolve();
            }
        }, timeoutMs);
    });
}

function extractLatestAssistantText(messages: Message[] | undefined, since: number): string | null {
    if (!messages || messages.length === 0) {
        return null;
    }

    for (const message of messages) {
        if (message.kind !== 'agent-text') {
            continue;
        }
        if (message.createdAt < since) {
            continue;
        }
        const text = message.text?.trim();
        if (text) {
            return text;
        }
    }

    return null;
}

async function playAudioUrl(audioUrl: string): Promise<void> {
    cleanupPlayer();

    return new Promise((resolve) => {
        const player = createAudioPlayer({ uri: audioUrl }, { updateInterval: 250 });
        currentPlayer = player;

        const finish = () => {
            subscription.remove();
            cleanupPlayer();
            resolve();
        };

        const subscription = player.addListener('playbackStatusUpdate', (status) => {
            if (status.didJustFinish) {
                finish();
            }
        });

        player.play();

        setTimeout(() => {
            if (currentPlayer?.id === player.id) {
                finish();
            }
        }, 90_000);
    });
}

class BailianVoiceSessionImpl implements VoiceSession {
    async startSession(config: VoiceSessionConfig): Promise<string | null> {
        if (!runtime) {
            throw new Error('Bailian voice session not initialized');
        }
        if (config.provider !== 'bailian') {
            throw new Error('Invalid voice provider for Bailian session');
        }

        currentSessionId = config.sessionId;
        await runtime.startRecording();
        storage.getState().setRealtimeStatus('connected');
        storage.getState().setRealtimeMode('user-speaking', true);
        return null;
    }

    async endSession(): Promise<void> {
        if (!runtime || !currentSessionId) {
            storage.getState().setRealtimeStatus('disconnected');
            storage.getState().setRealtimeMode('idle', true);
            return;
        }

        const sessionId = currentSessionId;
        currentSessionId = null;

        try {
            storage.getState().setRealtimeStatus('connecting');
            storage.getState().setRealtimeMode('idle', true);

            const transcript = await runtime.stopRecordingAndTranscribe();
            if (!transcript) {
                return;
            }

            const responseSince = Date.now();
            const readyPromise = waitForSessionReady(sessionId, 30_000);
            sync.sendMessage(sessionId, transcript, { source: 'voice' });
            await readyPromise;

            const assistantText = runtime.getLatestAssistantText(sessionId, responseSince);
            if (assistantText) {
                storage.getState().setRealtimeStatus('connected');
                storage.getState().setRealtimeMode('agent-speaking', true);
                await runtime.playTtsText(assistantText);
            }
        } finally {
            storage.getState().setRealtimeStatus('disconnected');
            storage.getState().setRealtimeMode('idle', true);
        }
    }

    sendTextMessage(_message: string): void {
        // Bailian mode does not run a bidirectional voice agent channel.
    }

    sendContextualUpdate(_update: string): void {
        // Bailian mode does not run a bidirectional voice agent channel.
    }

    onReady(sessionId: string): void {
        if (pendingReady?.sessionId === sessionId) {
            pendingReady.resolve();
        }
    }
}

export const BailianVoiceSession: React.FC = () => {
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const hasRegistered = useRef(false);

    useEffect(() => {
        runtime = {
            recorder,
            startRecording: async () => {
                await recorder.prepareToRecordAsync();
                recorder.record();
            },
            stopRecordingAndTranscribe: async () => {
                await recorder.stop();
                const fileUri = recorder.uri || recorder.getStatus().url;
                if (!fileUri) {
                    return null;
                }

                const credentials = await TokenStorage.getCredentials();
                if (!credentials) {
                    return null;
                }

                const file = new File(fileUri);
                const audioBytes = new Uint8Array(await file.arrayBuffer());
                const transcription = await transcribeBailianAudio(credentials, {
                    audioBase64: encodeBase64(audioBytes, 'base64'),
                    mimeType: 'audio/m4a',
                    language: storage.getState().settings.voiceAssistantLanguage ?? undefined,
                });

                const text = transcription.transcript.trim();
                return text || null;
            },
            playTtsText: async (text: string) => {
                const credentials = await TokenStorage.getCredentials();
                if (!credentials) {
                    return;
                }

                const tts = await fetchBailianTts(credentials, { text });
                await playAudioUrl(tts.audioUrl);
            },
            getLatestAssistantText: (sessionId: string, since: number) => {
                const messages = storage.getState().sessionMessages[sessionId]?.messages;
                return extractLatestAssistantText(messages, since);
            },
        };

        if (!hasRegistered.current) {
            registerVoiceSession(new BailianVoiceSessionImpl());
            hasRegistered.current = true;
        }

        return () => {
            runtime = null;
            pendingReady = null;
            cleanupPlayer();
        };
    }, [recorder]);

    return null;
};
