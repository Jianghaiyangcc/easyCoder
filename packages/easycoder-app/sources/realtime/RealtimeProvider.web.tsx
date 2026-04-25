import React from 'react';
import { RealtimeVoiceSession } from './RealtimeVoiceSession';
import { BailianVoiceSession } from './BailianVoiceSession';
import { useSetting } from '@/sync/storage';

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
    const voiceProvider = useSetting('voiceProvider');

    if (voiceProvider === 'bailian') {
        return (
            <>
                <BailianVoiceSession />
                {children}
            </>
        );
    }

    return (
        <>
            <RealtimeVoiceSession />
            {children}
        </>
    );
};
