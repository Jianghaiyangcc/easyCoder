import React, { useEffect, useRef } from 'react';
import { registerVoiceSession } from './RealtimeSession';
import { storage } from '@/sync/storage';
import { TokenStorage } from '@/auth/tokenStorage';
import { encodeBase64 } from '@/encryption/base64';
import { transcribeBailianAudio } from '@/sync/apiVoice';
import type { VoiceSession, VoiceSessionConfig } from './types';

interface BailianRuntime {
    startRecording: () => Promise<void>;
    stopRecordingAndTranscribe: () => Promise<string | null>;
}

let runtime: BailianRuntime | null = null;
let currentSessionId: string | null = null;
let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let chunks: BlobPart[] = [];
const MIN_RECORDING_DURATION_MS = 500;

function resolvePreferredRecorderMimeType(): string | null {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        return 'audio/webm;codecs=opus';
    }
    if (MediaRecorder.isTypeSupported('audio/webm')) {
        return 'audio/webm';
    }
    if (MediaRecorder.isTypeSupported('audio/mp4')) {
        return 'audio/mp4';
    }

    return null;
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

    async endSession(): Promise<string | null> {
        if (!runtime || !currentSessionId) {
            storage.getState().setRealtimeStatus('disconnected');
            storage.getState().setRealtimeMode('idle', true);
            return null;
        }

        currentSessionId = null;

        try {
            storage.getState().setRealtimeStatus('connecting');
            storage.getState().setRealtimeMode('idle', true);

            const transcript = await runtime.stopRecordingAndTranscribe();
            return transcript?.trim() || null;
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

}

export const BailianVoiceSession: React.FC = () => {
    const hasRegistered = useRef(false);

    useEffect(() => {
        let recordingStartedAt = 0;

        runtime = {
            startRecording: async () => {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const preferredMimeType = resolvePreferredRecorderMimeType();
                const recorder = preferredMimeType
                    ? new MediaRecorder(stream, { mimeType: preferredMimeType })
                    : new MediaRecorder(stream);

                mediaStream = stream;
                mediaRecorder = recorder;
                chunks = [];

                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                recorder.start();
                recordingStartedAt = Date.now();
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

                const durationMs = recordingStartedAt > 0 ? Date.now() - recordingStartedAt : 0;
                recordingStartedAt = 0;
                if (durationMs > 0 && durationMs < MIN_RECORDING_DURATION_MS) {
                    cleanupRecorder();
                    return null;
                }

                const blob = new Blob(chunks, {
                    type: activeRecorder.mimeType || 'audio/webm',
                });
                cleanupRecorder();

                const credentials = await TokenStorage.getCredentials();
                if (!credentials) {
                    return null;
                }

                const audioBytes = new Uint8Array(await blob.arrayBuffer());
                const { voiceAssistantLanguage, preferredLanguage } = storage.getState().settings;
                const transcription = await transcribeBailianAudio(credentials, {
                    audioBase64: encodeBase64(audioBytes, 'base64'),
                    mimeType: blob.type || 'audio/webm',
                    language: voiceAssistantLanguage ?? preferredLanguage ?? undefined,
                });

                const text = transcription.transcript.trim();
                return text || null;
            },
        };

        if (!hasRegistered.current) {
            registerVoiceSession(new BailianVoiceSessionImpl());
            hasRegistered.current = true;
        }

        return () => {
            runtime = null;
            cleanupRecorder();
        };
    }, []);

    return null;
};
