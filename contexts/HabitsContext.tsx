import React, { createContext, useContext, useState, useEffect } from 'react';
import { SpiritualHabit, SpiritualHabitCategory } from '../types';
import { useDataContext } from './DataContext';
import { useDataSync } from '../hooks/useDataSync';
import { safeLocalStorageGet } from '../utils';

interface HabitsContextType {
    habits: SpiritualHabit[];
    setHabits: React.Dispatch<React.SetStateAction<SpiritualHabit[]>>;
    categories: SpiritualHabitCategory[];
    setCategories: React.Dispatch<React.SetStateAction<SpiritualHabitCategory[]>>;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export const HabitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { cloudData, isDataLoaded, isInitialLoading } = useDataContext();

    const [habits, setHabits] = useState<SpiritualHabit[]>(() =>
        safeLocalStorageGet('crentify_habits', [])
    );

    const [categories, setCategories] = useState<SpiritualHabitCategory[]>(() =>
        safeLocalStorageGet('crentify_habits_categories', [
            { id: 'ora_1', name: 'ORAÇÃO' },
            { id: 'lei_2', name: 'LEITURA' },
            { id: 'jej_3', name: 'JEJUM' },
            { id: 'cul_4', name: 'CULTO' },
            { id: 'ser_5', name: 'SERVIÇO' },
            { id: 'est_6', name: 'ESTUDO' },
            { id: 'out_7', name: 'OUTRO' },
        ])
    );

    // Sync from Cloud
    useEffect(() => {
        if (isDataLoaded) {
            const processValue = (key: string, cloudValue: any, cloudTS: string, setter: (val: any) => void) => {
                const lastSyncedTS = localStorage.getItem(`${key}_last_synced_at`) || '0';
                const lastModifiedTS = localStorage.getItem(`${key}_last_modified_at`) || '0';

                const cloudTime = new Date(cloudTS).getTime();
                const syncedTime = new Date(lastSyncedTS).getTime();
                const modifiedTime = new Date(lastModifiedTS).getTime();

                if (cloudTime > syncedTime && cloudTime > modifiedTime) {
                    setter(cloudValue);
                    localStorage.setItem(`${key}_last_synced_at`, cloudTS);
                    localStorage.setItem(`${key}_last_modified_at`, cloudTS);
                }
            };

            if (cloudData.crentify_habits) {
                processValue('crentify_habits', cloudData.crentify_habits.value, cloudData.crentify_habits.updated_at, setHabits);
            }
            if (cloudData.crentify_habits_categories) {
                processValue('crentify_habits_categories', cloudData.crentify_habits_categories.value, cloudData.crentify_habits_categories.updated_at, setCategories);
            }
        }
    }, [isDataLoaded, cloudData]);

    // Sync to Cloud
    const canSync = isDataLoaded && !isInitialLoading;
    useDataSync(canSync ? 'crentify_habits' : '', habits);
    useDataSync(canSync ? 'crentify_habits_categories' : '', categories);

    // Local Storage
    useEffect(() => {
        localStorage.setItem('crentify_habits', JSON.stringify(habits));
        localStorage.setItem('crentify_habits_categories', JSON.stringify(categories));
    }, [habits, categories]);

    return (
        <HabitsContext.Provider value={{ habits, setHabits, categories, setCategories }}>
            {children}
        </HabitsContext.Provider>
    );
};

export const useHabits = () => {
    const context = useContext(HabitsContext);
    if (context === undefined) {
        throw new Error('useHabits must be used within a HabitsProvider');
    }
    return context;
};
