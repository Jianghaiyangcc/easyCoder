import React, { useEffect, useRef } from 'react';
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
    startRecording: () => Promise<void>;
    stopRecordingAndTranscribe: () => Promise<string | null>;
    playTtsText: (text: string) => Promise<void>;
    getLatestAssistantText: (sessionId: string, since: number) => string | null;
}

let runtime: BailianRuntime | null = null;
let currentSessionId: string | null = null;
let pendingReady: PendingReady | null = null;
let currentAudio: HTMLAudioElement | null = null;
let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let chunks: BlobPart[] = [];

function cleanupAudio() {
    if (!currentAudio) {
        return;
    }
    currentAudio.pause();
    currentAudio = null;
}

function cleanupRecorder() {
    if (mediaStream) {
        for (const track of mediaStream.getTracks()) {
            track.stop();
        }
    }
    mediaStream = null;
    mediaRecorder = null;
    chunks = [];
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
    cleanupAudio();

    await new Promise<void>((resolve) => {
        const audio = new Audio(audioUrl);
        currentAudio = audio;

        const finalize = () => {
            audio.onended = null;
            audio.onerror = null;
            if (currentAudio === audio) {
                currentAudio = null;
            }
            resolve();
        };

        audio.onended = finalize;
        audio.onerror = finalize;
        void audio.play().catch(finalize);

        setTimeout(finalize, 90_000);
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
    const hasRegistered = useRef(false);

    useEffect(() => {
        runtime = {
            startRecording: async () => {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream, {
                    mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                        ? 'audio/webm;codecs=opus'
                        : undefined,
                });

                mediaStream = stream;
                mediaRecorder = recorder;
                chunks = [];

                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                recorder.start();
            },
            stopRecordingAndTranscribe: async () => {
                const activeRecorder = mediaRecorder;
                if (!activeRecorder) {
                    return null;
                }

                await new Promise<void>((resolve) => {
                    activeRecorder.onstop = () => resolve();
                    activeRecorder.stop();
                });

                const blob = new Blob(chunks, {
                    type: activeRecorder.mimeType || 'audio/webm',
                });
                cleanupRecorder();

                const credentials = await TokenStorage.getCredentials();
                if (!credentials) {
                    return null;
                }

                const audioBytes = new Uint8Array(await blob.arrayBuffer());
                const transcription = await transcribeBailianAudio(credentials, {
                    audioBase64: encodeBase64(audioBytes, 'base64'),
                    mimeType: blob.type || 'audio/webm',
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
            cleanupAudio();
            cleanupRecorder();
        };
    }, []);

    return null;
};
