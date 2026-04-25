import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const BusinessInfoScreen = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-light bg-surface-light/80 dark:border-border-dark dark:bg-surface-dark/80 backdrop-blur-sm px-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex size-12 shrink-0 items-center justify-start cursor-pointer text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-black dark:text-white font-display">사업자 정보</h1>
                    <div className="flex size-12 shrink-0 items-center justify-end"></div>
                </header>

                <main className="flex-grow pb-4 bg-surface-light dark:bg-surface-dark">
                    <div className="p-6 space-y-6 text-center">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-4xl text-primary">business</span>
                        </div>

                        <h2 className="text-2xl font-bold text-black dark:text-white">LiveJourney</h2>
                        <p className="text-sm text-black/60 dark:text-white/60">당신의 여행을 생생하게 기록하세요</p>

                        <div className="bg-surface-subtle-light dark:bg-surface-subtle-dark rounded-xl p-6 text-left space-y-3 mt-8">
                            <div>
                                <p className="text-xs text-black/50 dark:text-white/50">대표이사</p>
                                <p className="text-sm font-medium text-black dark:text-white">홍길동</p>
                            </div>
                            <div>
                                <p className="text-xs text-black/50 dark:text-white/50">사업자등록번호</p>
                                <p className="text-sm font-medium text-black dark:text-white">123-45-67890</p>
                            </div>
                            <div>
                                <p className="text-xs text-black/50 dark:text-white/50">통신판매업신고</p>
                                <p className="text-sm font-medium text-black dark:text-white">제2026-서울강남-0000호</p>
                            </div>
                            <div>
                                <p className="text-xs text-black/50 dark:text-white/50">주소</p>
                                <p className="text-sm font-medium text-black dark:text-white">서울특별시 강남구 테헤란로 123, 4층</p>
                            </div>
                            <div>
                                <p className="text-xs text-black/50 dark:text-white/50">고객센터</p>
                                <p className="text-sm font-medium text-black dark:text-white">02-1234-5678 (평일 09:00~18:00)</p>
                            </div>
                            <div>
                                <p className="text-xs text-black/50 dark:text-white/50">이메일</p>
                                <p className="text-sm font-medium text-black dark:text-white">help@livejourney.com</p>
                            </div>
                        </div>

                        <p className="text-xs text-black/40 dark:text-white/40 mt-8">
                            Copyright © LiveJourney Corp. All rights reserved.
                        </p>
                    </div>
                </main>
            </div>

            <BottomNavigation />
        </div>
    );
};

export default BusinessInfoScreen;
