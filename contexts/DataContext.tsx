
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { loadUserData, loadSharedData } from '../services/userDataService';
import { ADMIN_EMAILS } from '../constants';
import { BibleData } from '../types';

interface DataContextType {
    isInitialLoading: boolean;
    isDataLoaded: boolean;
    isSharedDataLoading: boolean;
    cloudData: any;
    sharedData: any;
    bibleData: BibleData | null;
    setBibleData: (data: BibleData) => void;
    isBibleLoading: boolean;
    cloudSyncStatus: Record<string, boolean>;
    setCloudSyncStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    updateBibleData: (data: BibleData) => Promise<void>;
    hasFetchError: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// IndexedDB Constants
const DB_NAME = 'Crentify_Final_Storage';
const STORE_NAME = 'BibleStore';
const DB_VERSION = 2;

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, loading: authLoading } = useAuth();
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isSharedDataLoading, setIsSharedDataLoading] = useState(true);
    const [cloudData, setCloudData] = useState<any>({});
    const [sharedData, setSharedData] = useState<any>({});
    const [bibleData, setBibleData] = useState<BibleData | null>(null);
    const [isBibleLoading, setIsBibleLoading] = useState(true);
    const [cloudSyncStatus, setCloudSyncStatus] = useState<Record<string, boolean>>({});
    const [hasFetchError, setHasFetchError] = useState(false);

    // Carregar Bíblia do IndexedDB ao iniciar
    useEffect(() => {
        const loadBible = async () => {
            try {
                const db = await initDB();
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.get('bible_main_data');

                request.onsuccess = () => {
                    if (request.result) {
                        setBibleData(request.result);
                    }
                    setIsBibleLoading(false);
                };
                request.onerror = () => setIsBibleLoading(false);
            } catch (e) {
                console.error("Erro ao carregar banco de dados:", e);
                setIsBibleLoading(false);
            }
        };
        loadBible();
    }, []);

    // Cloud Data Synchronization
    useEffect(() => {
        if (session?.user) {
            console.log("☁️ DataContext: Iniciando carregamento de dados...");
            loadUserData().then(data => {
                setCloudData(data);
                setIsDataLoaded(true);
                setIsInitialLoading(false);
                setHasFetchError(false);
            }).catch(err => {
                console.error("❌ DataContext: Erro ao carregar dados do usuário:", err);
                setHasFetchError(true);
                setIsInitialLoading(false);
                setIsDataLoaded(false); // Garantir que está falso se falhar
            });

            setIsSharedDataLoading(true);
            loadSharedData(ADMIN_EMAILS).then(data => {
                setSharedData(data);
                const status: Record<string, boolean> = {};
                Object.keys(data).forEach(k => status[k] = true);
                setCloudSyncStatus(status);

                if (data.crentify_bible_data) {
                    setBibleData(data.crentify_bible_data);
                }

                setIsSharedDataLoading(false);
            }).catch(err => {
                console.error("❌ DataContext: Erro ao carregar dados compartilhados:", err);
                setIsSharedDataLoading(false);
                setHasFetchError(true); // Se os dados mestre falharem, consideramos erro de busca geral
            });
        } else if (!authLoading) {
            setIsInitialLoading(false);
            setIsSharedDataLoading(false);
        }
    }, [session, authLoading]);

    const updateBibleData = useCallback(async (data: BibleData) => {
        setBibleData(data);
        try {
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(data, 'bible_main_data');

            const { saveUserData } = await import('../services/userDataService');
            saveUserData('crentify_bible_data', data)
                .then((serverTimestamp) => {
                    setCloudSyncStatus(prev => ({ ...prev, crentify_bible_data: true }));
                    if (serverTimestamp) {
                        localStorage.setItem('crentify_bible_data_last_synced_at', serverTimestamp);
                    }
                })
                .catch(() => {
                    setCloudSyncStatus(prev => ({ ...prev, crentify_bible_data: false }));
                });

            return new Promise<void>((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error("❌ Erro ao salvar a Bíblia:", e);
            throw e;
        }
    }, []);

    return (
        <DataContext.Provider value={{
            isInitialLoading,
            isDataLoaded,
            isSharedDataLoading,
            cloudData,
            sharedData,
            bibleData,
            setBibleData,
            isBibleLoading,
            cloudSyncStatus,
            setCloudSyncStatus,
            updateBibleData,
            hasFetchError
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};
