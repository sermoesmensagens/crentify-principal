import React, { createContext, useContext, useState, useEffect } from 'react';
import { ServiceEvent, ServiceDetail, ServiceCategory } from '../types';
import { useDataContext } from './DataContext';
import { useDataSync } from '../hooks/useDataSync';
import { safeLocalStorageGet } from '../utils';

interface ServiceContextType {
    events: ServiceEvent[];
    setEvents: React.Dispatch<React.SetStateAction<ServiceEvent[]>>;
    details: ServiceDetail[];
    setDetails: React.Dispatch<React.SetStateAction<ServiceDetail[]>>;
    categories: ServiceCategory[];
    setCategories: React.Dispatch<React.SetStateAction<ServiceCategory[]>>;
    toggleServiceCompletion: (detailId: string, date: string) => void;
    updateServiceNotes: (detailId: string, notes: string) => void;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { cloudData, isDataLoaded, isInitialLoading } = useDataContext();

    const [events, setEvents] = useState<ServiceEvent[]>(() =>
        safeLocalStorageGet('crentify_service_events', [])
    );

    const [details, setDetails] = useState<ServiceDetail[]>(() =>
        safeLocalStorageGet('crentify_service_details', [])
    );

    const [categories, setCategories] = useState<ServiceCategory[]>(() =>
        safeLocalStorageGet('crentify_service_categories', [
            { id: '1', name: 'SERMÕES' }
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

            if (cloudData.crentify_service_events) {
                processValue('crentify_service_events', cloudData.crentify_service_events.value, cloudData.crentify_service_events.updated_at, setEvents);
            }
            if (cloudData.crentify_service_details) {
                processValue('crentify_service_details', cloudData.crentify_service_details.value, cloudData.crentify_service_details.updated_at, setDetails);
            }
            if (cloudData.crentify_service_categories) {
                processValue('crentify_service_categories', cloudData.crentify_service_categories.value, cloudData.crentify_service_categories.updated_at, setCategories);
            }
        }
    }, [isDataLoaded, cloudData]);

    // Sync to Cloud
    const canSync = isDataLoaded && !isInitialLoading;
    useDataSync(canSync ? 'crentify_service_events' : '', events);
    useDataSync(canSync ? 'crentify_service_details' : '', details);
    useDataSync(canSync ? 'crentify_service_categories' : '', categories);

    // Local Storage
    useEffect(() => {
        localStorage.setItem('crentify_service_events', JSON.stringify(events));
        localStorage.setItem('crentify_service_details', JSON.stringify(details));
        localStorage.setItem('crentify_service_categories', JSON.stringify(categories));
    }, [events, details, categories]);

    const toggleServiceCompletion = (detailId: string, date: string) => {
        setDetails(prev => prev.map(d => {
            if (d.id === detailId) {
                const completions = { ...(d.completions || {}) };
                completions[date] = !completions[date];
                return { ...d, completions };
            }
            return d;
        }));
        localStorage.setItem('crentify_service_details_last_modified_at', new Date().toISOString());
    };

    const updateServiceNotes = (detailId: string, notes: string) => {
        setDetails(prev => prev.map(d => {
            if (d.id === detailId) {
                return { ...d, notes };
            }
            return d;
        }));
        localStorage.setItem('crentify_service_details_last_modified_at', new Date().toISOString());
    };

    return (
        <ServiceContext.Provider value={{ 
            events, setEvents, 
            details, setDetails, 
            categories, setCategories,
            toggleServiceCompletion,
            updateServiceNotes
        }}>
            {children}
        </ServiceContext.Provider>
    );
};

export const useServices = () => {
    const context = useContext(ServiceContext);
    if (context === undefined) {
        throw new Error('useServices must be used within a ServiceProvider');
    }
    return context;
};
