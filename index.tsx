
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { BibleProvider } from './contexts/BibleContext';
import { TarefasProvider } from './contexts/TarefasContext';
import { AcademyProvider } from './contexts/AcademyContext';
import { HabitsProvider } from './contexts/HabitsContext';
import { DiaryProvider } from './contexts/DiaryContext';
import { StudyProvider } from './contexts/StudyContext';
import { ReadingPlanProvider } from './contexts/ReadingPlanContext';
import { PrayerProvider } from './contexts/PrayerContext';
import { ServiceProvider } from './contexts/ServiceContext';

import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <BibleProvider>
            <TarefasProvider>
                <AcademyProvider>
                  <StudyProvider>
                    <HabitsProvider>
                    <DiaryProvider>
                      <ReadingPlanProvider>
                        <PrayerProvider>
                          <ServiceProvider>
                            <App />
                          </ServiceProvider>
                        </PrayerProvider>
                      </ReadingPlanProvider>
                    </DiaryProvider>
                    </HabitsProvider>
                  </StudyProvider>
                </AcademyProvider>
            </TarefasProvider>
          </BibleProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
