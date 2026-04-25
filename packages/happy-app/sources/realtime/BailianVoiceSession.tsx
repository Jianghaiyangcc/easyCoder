import React, { useEffect, useRef } from 'react';
import { RecordingPresets, useAudioRecorder, type AudioRecorder } from 'expo-audio';
import { File } from 'expo-file-system';
import { registerVoiceSession } from './RealtimeSession';
import { storage } from '@/sync/storage';
import { TokenStorage } from '@/auth/tokenStorage';
import { encodeBase64 } from '@/encryption/base64';
import { transcribeBailianAudio } from '@/sync/apiVoice';
import type { VoiceSession, VoiceSessionConfig } from './types';

interface BailianRuntime {
    recorder: AudioRecorder;
    startRecording: () => Promise<void>;
    stopRecordingAndTranscribe: () => Promise<string | null>;
}

let runtime: BailianRuntime | null = null;
let currentSessionId: string | null = null;

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
        };

        if (!hasRegistered.current) {
            registerVoiceSession(new BailianVoiceSessionImpl());
            hasRegistered.current = true;
        }

        return () => {
            runtime = null;
        };
    }, [recorder]);

    return null;
};
