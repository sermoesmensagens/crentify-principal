
import React, { createContext, useContext, useState, useEffect } from 'react';
import { BibleProgress, BibleNote } from '../types';
import { useDataContext } from './DataContext';
import { useDataSync } from '../hooks/useDataSync';
import { safeLocalStorageGet } from '../utils';

interface BibleContextType {
    progress: BibleProgress;
    setProgress: React.Dispatch<React.SetStateAction<BibleProgress>>;
    notes: BibleNote[];
    setNotes: React.Dispatch<React.SetStateAction<BibleNote[]>>;
}

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export const BibleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { cloudData, isDataLoaded, isInitialLoading } = useDataContext();

    const [progress, setProgress] = useState<BibleProgress>(() =>
        safeLocalStorageGet('crentify_bible_progress', { completedChapters: {} })
    );
    const [notes, setNotes] = useState<BibleNote[]>(() =>
        safeLocalStorageGet('crentify_bible_notes', [])
    );

    // Sync from Cloud
    useEffect(() => {
        if (isDataLoaded) {
            if (cloudData.crentify_bible_progress) {
                const { value, updated_at } = cloudData.crentify_bible_progress;
                const lastSyncedTS = localStorage.getItem('crentify_bible_progress_last_synced_at') || '0';
                const lastModifiedTS = localStorage.getItem('crentify_bible_progress_last_modified_at') || '0';
                if (new Date(updated_at).getTime() > new Date(lastSyncedTS).getTime() &&
                    new Date(updated_at).getTime() > new Date(lastModifiedTS).getTime()) {
                    setProgress(value);
                    localStorage.setItem('crentify_bible_progress_last_synced_at', updated_at);
                    localStorage.setItem('crentify_bible_progress_last_modified_at', updated_at);
                }
            }
            if (cloudData.crentify_bible_notes) {
                const { value, updated_at } = cloudData.crentify_bible_notes;
                const lastSyncedTS = localStorage.getItem('crentify_bible_notes_last_synced_at') || '0';
                const lastModifiedTS = localStorage.getItem('crentify_bible_notes_last_modified_at') || '0';
                if (new Date(updated_at).getTime() > new Date(lastSyncedTS).getTime() &&
                    new Date(updated_at).getTime() > new Date(lastModifiedTS).getTime()) {
                    setNotes(value);
                    localStorage.setItem('crentify_bible_notes_last_synced_at', updated_at);
                    localStorage.setItem('crentify_bible_notes_last_modified_at', updated_at);
                }
            }
        }
    }, [isDataLoaded, cloudData]);

    // Sync to Cloud
    const canSync = isDataLoaded && !isInitialLoading;
    useDataSync(canSync ? 'crentify_bible_progress' : '', progress);
    useDataSync(canSync ? 'crentify_bible_notes' : '', notes);

    // Local Storage
    useEffect(() => {
        localStorage.setItem('crentify_bible_progress', JSON.stringify(progress));
        localStorage.setItem('crentify_bible_notes', JSON.stringify(notes));
    }, [progress, notes]);

    return (
        <BibleContext.Provider value={{ progress, setProgress, notes, setNotes }}>
            {children}
        </BibleContext.Provider>
    );
};

export const useBible = () => {
    const context = useContext(BibleContext);
    if (context === undefined) {
        throw new Error('useBible must be used within a BibleProvider');
    }
    return context;
};
