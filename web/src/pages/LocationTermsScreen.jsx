import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const LocationTermsScreen = () => {
    const navigate = useNavigate();

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
                    <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-black dark:text-white font-display">위치기반 서비스 이용약관</h1>
                    <div className="flex size-12 shrink-0 items-center justify-end"></div>
                </header>

                <main className="flex-grow pb-4 bg-surface-light dark:bg-surface-dark">
                    <div className="p-6 space-y-6">
                        <div className="space-y-4 text-black dark:text-white">
                            <h2 className="text-xl font-bold text-black dark:text-white">제1조 (목적)</h2>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                본 약관은 회사가 제공하는 위치기반서비스와 관련하여 회사와 개인위치정보주체와의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                            </p>
                        </div>

                        <div className="space-y-4 text-black dark:text-white">
                            <h2 className="text-xl font-bold text-black dark:text-white">제2조 (약관 외 준칙)</h2>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                이 약관에 명시되지 않은 사항은 위치정보의 보호 및 이용 등에 관한 법률, 개인정보 보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 전기통신기본법, 전기통신사업법 등 관계법령과 회사의 이용약관 및 개인정보처리방침, 회사가 별도로 정한 지침 등에 따릅니다.
                            </p>
                        </div>

                        <div className="space-y-4 text-black dark:text-white">
                            <h2 className="text-xl font-bold text-black dark:text-white">제3조 (서비스의 내용)</h2>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                회사는 위치정보사업자로부터 위치정보를 전달받아 아래와 같은 위치기반서비스를 제공합니다.<br />
                                1. 현재 위치를 활용한 주변 장소 검색/추천 서비스<br />
                                2. 게시물 작성 시 위치 기록 기능 제공
                            </p>
                        </div>

                        <div className="pt-6 pb-2">
                            <p className="text-xs text-black/70 dark:text-white/70">시행일자: 2026년 01월 24일</p>
                        </div>
                    </div>
                </main>
            </div>

            <BottomNavigation />
        </div>
    );
};

export default LocationTermsScreen;
