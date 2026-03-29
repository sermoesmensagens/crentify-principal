
import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudyItem, StudyCategory, UserCourse, UserLesson, StudyProgress } from '../types';
import { useDataContext } from './DataContext';
import { useDataSync } from '../hooks/useDataSync';
import { safeLocalStorageGet } from '../utils';

interface StudyContextType {
    studies: StudyItem[];
    setStudies: React.Dispatch<React.SetStateAction<StudyItem[]>>;
    categories: StudyCategory[];
    setCategories: React.Dispatch<React.SetStateAction<StudyCategory[]>>;
    userCourses: UserCourse[];
    setUserCourses: React.Dispatch<React.SetStateAction<UserCourse[]>>;
    userLessons: UserLesson[];
    setUserLessons: React.Dispatch<React.SetStateAction<UserLesson[]>>;
    studyProgress: StudyProgress;
    setStudyProgress: React.Dispatch<React.SetStateAction<StudyProgress>>;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { cloudData, isDataLoaded, isInitialLoading } = useDataContext();

    const [studies, setStudies] = useState<StudyItem[]>(() =>
        safeLocalStorageGet('crentify_studies', [])
    );

    const [categories, setCategories] = useState<StudyCategory[]>(() =>
        safeLocalStorageGet('crentify_study_categories', [
            { id: 'st_1', name: 'TEOLOGIA' },
            { id: 'st_2', name: 'BÍBLIA' },
            { id: 'st_3', name: 'LIDERANÇA' },
            { id: 'st_4', name: 'MINISTÉRIO' },
            { id: 'st_5', name: 'HISTÓRIA' },
        ])
    );

    const [userCourses, setUserCourses] = useState<UserCourse[]>(() =>
        safeLocalStorageGet('crentify_user_courses', [])
    );

    const [userLessons, setUserLessons] = useState<UserLesson[]>(() =>
        safeLocalStorageGet('crentify_user_lessons', [])
    );

    const [studyProgress, setStudyProgress] = useState<StudyProgress>(() =>
        safeLocalStorageGet('crentify_study_progress', { completedLessons: [] })
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

            if (cloudData.crentify_studies) {
                processValue('crentify_studies', cloudData.crentify_studies.value, cloudData.crentify_studies.updated_at, setStudies);
            }
            if (cloudData.crentify_study_categories) {
                processValue('crentify_study_categories', cloudData.crentify_study_categories.value, cloudData.crentify_study_categories.updated_at, setCategories);
            }
            if (cloudData.crentify_user_courses) {
                processValue('crentify_user_courses', cloudData.crentify_user_courses.value, cloudData.crentify_user_courses.updated_at, setUserCourses);
            }
            if (cloudData.crentify_user_lessons) {
                processValue('crentify_user_lessons', cloudData.crentify_user_lessons.value, cloudData.crentify_user_lessons.updated_at, setUserLessons);
            }
            if (cloudData.crentify_study_progress) {
                processValue('crentify_study_progress', cloudData.crentify_study_progress.value, cloudData.crentify_study_progress.updated_at, setStudyProgress);
            }
        }
    }, [isDataLoaded, cloudData]);

    // Sync to Cloud
    const canSync = isDataLoaded && !isInitialLoading;
    useDataSync(canSync ? 'crentify_studies' : '', studies);
    useDataSync(canSync ? 'crentify_study_categories' : '', categories);
    useDataSync(canSync ? 'crentify_user_courses' : '', userCourses);
    useDataSync(canSync ? 'crentify_user_lessons' : '', userLessons);
    useDataSync(canSync ? 'crentify_study_progress' : '', studyProgress);

    // Local Storage
    useEffect(() => {
        localStorage.setItem('crentify_studies', JSON.stringify(studies));
        localStorage.setItem('crentify_study_categories', JSON.stringify(categories));
        localStorage.setItem('crentify_user_courses', JSON.stringify(userCourses));
        localStorage.setItem('crentify_user_lessons', JSON.stringify(userLessons));
        localStorage.setItem('crentify_study_progress', JSON.stringify(studyProgress));
    }, [studies, categories, userCourses, userLessons, studyProgress]);

    return (
        <StudyContext.Provider value={{
            studies, setStudies, categories, setCategories,
            userCourses, setUserCourses, userLessons, setUserLessons,
            studyProgress, setStudyProgress
        }}>
            {children}
        </StudyContext.Provider>
    );
};

export const useStudies = () => {
    const context = useContext(StudyContext);
    if (context === undefined) {
        throw new Error('useStudies must be used within a StudyProvider');
    }
    return context;
};
