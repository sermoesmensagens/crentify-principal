import React from 'react';
import Sidebar from './Sidebar';
import { Section } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    activeSection: Section;
    setActiveSection: (section: Section) => void;
    onProfileClick: () => void;
    userEmail?: string;
}

const Layout: React.FC<LayoutProps> = ({
    children,
    activeSection,
    setActiveSection,
    onProfileClick,
    userEmail
}) => {
    return (
        <div className="flex bg-brand-bg text-white overflow-hidden font-sans h-[100dvh]">
            <Sidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                onProfileClick={onProfileClick}
                userEmail={userEmail}
            />
            <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                <div className="max-w-7xl mx-auto min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
