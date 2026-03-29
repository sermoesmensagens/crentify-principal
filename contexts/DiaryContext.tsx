
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DiaryEntry } from '../types';
import { useDataContext } from './DataContext';
import { useDataSync } from '../hooks/useDataSync';
import { safeLocalStorageGet } from '../utils';

interface DiaryContextType {
    entries: DiaryEntry[];
    setEntries: React.Dispatch<React.SetStateAction<DiaryEntry[]>>;
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

export const DiaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { cloudData, isDataLoaded, isInitialLoading } = useDataContext();

    const [entries, setEntries] = useState<DiaryEntry[]>(() =>
        safeLocalStorageGet('crentify_diary', [])
    );

    // Sync from Cloud
    useEffect(() => {
        if (isDataLoaded && cloudData.crentify_diary) {
            const { value } = cloudData.crentify_diary;
            setEntries(value);
        }
    }, [isDataLoaded, cloudData]);

    // Sync to Cloud
    const canSync = isDataLoaded && !isInitialLoading;
    useDataSync(canSync ? 'crentify_diary' : '', entries);

    // Local Storage
    useEffect(() => {
        localStorage.setItem('crentify_diary', JSON.stringify(entries));
    }, [entries]);

    return (
        <DiaryContext.Provider value={{ entries, setEntries }}>
            {children}
        </DiaryContext.Provider>
    );
};

export const useDiary = () => {
    const context = useContext(DiaryContext);
    if (context === undefined) {
        throw new Error('useDiary must be used within a DiaryProvider');
    }
    return context;
};
