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
    toggleServiceCompletion: (detailId: string, date: string) => void;
    updateServiceNotes: (detailId: string, notes: string) => void;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

const DEFAULT_ACTIVITIES: ServiceEvent[] = [
    { id: '1', title: 'CULTO ONLINE', categoryId: '1', createdAt: new Date().toISOString() },
    { id: '2', title: 'CULTO PRESENCIAL', categoryId: '1', createdAt: new Date().toISOString() },
    { id: '3', title: 'DEVOCIONAL DIÁRIO', categoryId: '1', createdAt: new Date().toISOString() },
    { id: '4', title: 'ESTUDO BÍBLICO', categoryId: '1', createdAt: new Date().toISOString() }
];

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { cloudData, isDataLoaded, isInitialLoading } = useDataContext();

    const [events, setEvents] = useState<ServiceEvent[]>(() => {
        const saved = safeLocalStorageGet('crentify_service_events', []);
        return saved.length > 0 ? saved : DEFAULT_ACTIVITIES;
    });

    const [details, setDetails] = useState<ServiceDetail[]>(() =>
        safeLocalStorageGet('crentify_service_details', [])
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
        }
    }, [isDataLoaded, cloudData]);

    // Sync to Cloud
    const canSync = isDataLoaded && !isInitialLoading;
    useDataSync(canSync ? 'crentify_service_events' : '', events);
    useDataSync(canSync ? 'crentify_service_details' : '', details);

    // Local Storage
    useEffect(() => {
        localStorage.setItem('crentify_service_events', JSON.stringify(events));
        localStorage.setItem('crentify_service_details', JSON.stringify(details));
    }, [events, details]);

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
