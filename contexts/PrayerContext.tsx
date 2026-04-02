
import React, { createContext, useContext, useState, useEffect } from 'react';
import { PrayerTheme, PrayerContent, PrayerCategory, PersonalPrayer, PrayerProgress, PrayerWeekCategory, PrayerDayCategory } from '../types';
import { useDataContext } from './DataContext';
import { useDataSync } from '../hooks/useDataSync';
import { useAuth } from './AuthContext';
import { ADMIN_EMAILS } from '../constants';
import { safeLocalStorageGet } from '../utils';

interface PrayerContextType {
    themes: PrayerTheme[];
    setThemes: React.Dispatch<React.SetStateAction<PrayerTheme[]>>;
    content: PrayerContent[];
    setContent: React.Dispatch<React.SetStateAction<PrayerContent[]>>;
    categories: PrayerCategory[];
    setCategories: React.Dispatch<React.SetStateAction<PrayerCategory[]>>;
    personalPrayers: PersonalPrayer[];
    setPersonalPrayers: React.Dispatch<React.SetStateAction<PersonalPrayer[]>>;
    progress: PrayerProgress;
    setProgress: React.Dispatch<React.SetStateAction<PrayerProgress>>;
    weekCategories: PrayerWeekCategory[];
    setWeekCategories: React.Dispatch<React.SetStateAction<PrayerWeekCategory[]>>;
    dayCategories: PrayerDayCategory[];
    setDayCategories: React.Dispatch<React.SetStateAction<PrayerDayCategory[]>>;
}

const PrayerContext = createContext<PrayerContextType | undefined>(undefined);

export const PrayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session } = useAuth();
    const { cloudData, sharedData, isDataLoaded, isInitialLoading, isSharedDataLoading } = useDataContext();
    const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email.toLowerCase());

    const [themes, setThemes] = useState<PrayerTheme[]>(() => safeLocalStorageGet('crentify_prayer_themes', []));
    const [content, setContent] = useState<PrayerContent[]>(() => safeLocalStorageGet('crentify_prayer_content', []));
    const [categories, setCategories] = useState<PrayerCategory[]>(() => safeLocalStorageGet('crentify_prayer_categories', [
        { id: "1", name: "Geral" }, { id: "2", name: "Intercessão" }, { id: "3", name: "Clamor" }
    ]));
    const [personalPrayers, setPersonalPrayers] = useState<PersonalPrayer[]>(() => safeLocalStorageGet('crentify_personal_prayers', []));
    const [progress, setProgress] = useState<PrayerProgress>(() => safeLocalStorageGet('crentify_prayer_progress', { completedResources: [] }));
    
    const [weekCategories, setWeekCategories] = useState<PrayerWeekCategory[]>(() => safeLocalStorageGet('crentify_prayer_weeks', [
        { id: "w1", name: "Semana 1" }, { id: "w2", name: "Semana 2" }
    ]));
    const [dayCategories, setDayCategories] = useState<PrayerDayCategory[]>(() => safeLocalStorageGet('crentify_prayer_days', [
        { id: "d1", name: "Segunda" }, { id: "d2", name: "Terça" }, { id: "d3", name: "Quarta" },
        { id: "d4", name: "Quinta" }, { id: "d5", name: "Sexta" }, { id: "d6", name: "Sábado" }, { id: "d7", name: "Domingo" }
    ]));

    // Sync from Cloud (User Data)
    useEffect(() => {
        if (isDataLoaded) {
            if (cloudData.crentify_personal_prayers) setPersonalPrayers(cloudData.crentify_personal_prayers.value);
            if (cloudData.crentify_prayer_progress) setProgress(cloudData.crentify_prayer_progress.value);

            if (isAdmin) {
                if (cloudData.crentify_prayer_themes) setThemes(cloudData.crentify_prayer_themes.value);
                if (cloudData.crentify_prayer_content) setContent(cloudData.crentify_prayer_content.value);
                if (cloudData.crentify_prayer_categories) setCategories(cloudData.crentify_prayer_categories.value);
                if (cloudData.crentify_prayer_weeks) setWeekCategories(cloudData.crentify_prayer_weeks.value);
                if (cloudData.crentify_prayer_days) setDayCategories(cloudData.crentify_prayer_days.value);
            }
        }
    }, [isDataLoaded, cloudData, isAdmin]);

    // Sync from Shared Data
    useEffect(() => {
        if (!isSharedDataLoading && sharedData) {
            if (sharedData.crentify_prayer_themes?.length > 0) setThemes(sharedData.crentify_prayer_themes);
            if (sharedData.crentify_prayer_content?.length > 0) setContent(sharedData.crentify_prayer_content);
            if (sharedData.crentify_prayer_categories) setCategories(sharedData.crentify_prayer_categories);
            if (sharedData.crentify_prayer_weeks) setWeekCategories(sharedData.crentify_prayer_weeks);
            if (sharedData.crentify_prayer_days) setDayCategories(sharedData.crentify_prayer_days);
        }
    }, [isSharedDataLoading, sharedData]);

    const isAllDataLoaded = isDataLoaded && !isInitialLoading && !isSharedDataLoading;
    
    useDataSync(isAllDataLoaded ? 'crentify_personal_prayers' : '', personalPrayers);
    useDataSync(isAllDataLoaded ? 'crentify_prayer_progress' : '', progress);

    const canSyncShared = isAdmin && isAllDataLoaded;
    useDataSync((canSyncShared && (themes.length > 0 || sharedData.crentify_prayer_themes)) ? 'crentify_prayer_themes' : '', isAdmin ? themes : null);
    useDataSync((canSyncShared && (content.length > 0 || sharedData.crentify_prayer_content)) ? 'crentify_prayer_content' : '', isAdmin ? content : null);
    useDataSync((canSyncShared && (categories.length > 0 || sharedData.crentify_prayer_categories)) ? 'crentify_prayer_categories' : '', isAdmin ? categories : null);
    useDataSync((canSyncShared && (weekCategories.length > 0 || sharedData.crentify_prayer_weeks)) ? 'crentify_prayer_weeks' : '', isAdmin ? weekCategories : null);
    useDataSync((canSyncShared && (dayCategories.length > 0 || sharedData.crentify_prayer_days)) ? 'crentify_prayer_days' : '', isAdmin ? dayCategories : null);

    useEffect(() => {
        localStorage.setItem('crentify_prayer_themes', JSON.stringify(themes));
        localStorage.setItem('crentify_prayer_content', JSON.stringify(content));
        localStorage.setItem('crentify_prayer_categories', JSON.stringify(categories));
        localStorage.setItem('crentify_prayer_weeks', JSON.stringify(weekCategories));
        localStorage.setItem('crentify_prayer_days', JSON.stringify(dayCategories));
        localStorage.setItem('crentify_personal_prayers', JSON.stringify(personalPrayers));
        localStorage.setItem('crentify_prayer_progress', JSON.stringify(progress));
    }, [themes, content, categories, personalPrayers, progress, weekCategories, dayCategories]);

    return (
        <PrayerContext.Provider value={{
            themes, setThemes, content, setContent, categories, setCategories,
            personalPrayers, setPersonalPrayers, progress, setProgress,
            weekCategories, setWeekCategories, dayCategories, setDayCategories
        }}>
            {children}
        </PrayerContext.Provider>
    );
};

export const usePrayer = () => {
    const context = useContext(PrayerContext);
    if (context === undefined) {
        throw new Error('usePrayer must be used within a PrayerProvider');
    }
    return context;
};
