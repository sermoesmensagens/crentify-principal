
import React, { createContext, useContext, useState, useEffect } from 'react';
import { WorkflowTask, WorkflowCategory } from '../types';
import { useDataContext } from './DataContext';
import { useDataSync } from '../hooks/useDataSync';
import { safeLocalStorageGet } from '../utils';

interface TarefasContextType {
    tasks: WorkflowTask[];
    setTasks: React.Dispatch<React.SetStateAction<WorkflowTask[]>>;
    categories: WorkflowCategory[];
    setCategories: React.Dispatch<React.SetStateAction<WorkflowCategory[]>>;
}

const TarefasContext = createContext<TarefasContextType | undefined>(undefined);

export const TarefasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { cloudData, isDataLoaded, isInitialLoading } = useDataContext();

    const [tasks, setTasks] = useState<WorkflowTask[]>(() =>
        safeLocalStorageGet('crentify_workflow', [])
    );

    const [categories, setCategories] = useState<WorkflowCategory[]>(() =>
        safeLocalStorageGet('crentify_workflow_categories', [
            { id: '1', name: 'Reunião' },
            { id: '2', name: 'Projeto' },
            { id: '3', name: 'Estudo' },
            { id: '4', name: 'Apresentação' },
            { id: '5', name: 'Revisão' },
        ])
    );

    // Sync from Cloud data
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

            if (cloudData.crentify_workflow) {
                processValue('crentify_workflow', cloudData.crentify_workflow.value, cloudData.crentify_workflow.updated_at, setTasks);
            }
            if (cloudData.crentify_workflow_categories) {
                processValue('crentify_workflow_categories', cloudData.crentify_workflow_categories.value, cloudData.crentify_workflow_categories.updated_at, setCategories);
            }
        }
    }, [isDataLoaded, cloudData]);

    // Sync to Cloud
    const canSync = isDataLoaded && !isInitialLoading;
    useDataSync(canSync ? 'crentify_workflow' : '', tasks);
    useDataSync(canSync ? 'crentify_workflow_categories' : '', categories);

    // Local Storage persistence
    useEffect(() => {
        localStorage.setItem('crentify_workflow', JSON.stringify(tasks));
        localStorage.setItem('crentify_workflow_categories', JSON.stringify(categories));
    }, [tasks, categories]);

    return (
        <TarefasContext.Provider value={{ tasks, setTasks, categories, setCategories }}>
            {children}
        </TarefasContext.Provider>
    );
};

export const useTarefas = () => {
    const context = useContext(TarefasContext);
    if (context === undefined) {
        throw new Error('useTarefas must be used within a TarefasProvider');
    }
    return context;
};
