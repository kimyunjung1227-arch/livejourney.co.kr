import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const OpenSourceLicensesScreen = () => {
    const navigate = useNavigate();

    const licenses = [
        { name: 'React', version: '18.2.0', license: 'MIT' },
        { name: 'React Router', version: '6.14.2', license: 'MIT' },
        { name: 'Tailwind CSS', version: '3.3.3', license: 'MIT' },
        { name: 'Vite', version: '4.4.5', license: 'MIT' },
        { name: 'Lucide React', version: '0.263.1', license: 'ISC' },
    ];

    return (
        <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-light bg-surface-light/80 dark:border-border-dark dark:bg-surface-dark/80 backdrop-blur-sm px-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex size-12 shrink-0 items-center justify-start cursor-pointer text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-black dark:text-white font-display">오픈소스 라이선스</h1>
                    <div className="flex size-12 shrink-0 items-center justify-end"></div>
                </header>

                <main className="flex-grow pb-4 bg-surface-light dark:bg-surface-dark">
                    <div className="p-4 space-y-4">
                        <p className="text-sm text-black/70 dark:text-white/70 px-2">
                            본 서비스는 다음의 오픈소스 소프트웨어를 포함하고 있습니다.
                        </p>

                        <div className="flex flex-col gap-3">
                            {licenses.map((lib, index) => (
                                <div key={index} className="bg-surface-subtle-light dark:bg-surface-subtle-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-black dark:text-white">{lib.name}</h3>
                                        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-2 py-1 rounded">{lib.license}</span>
                                    </div>
                                    <p className="text-sm text-black/60 dark:text-white/60 mt-1">Version {lib.version}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            <BottomNavigation />
        </div>
    );
};

export default OpenSourceLicensesScreen;
