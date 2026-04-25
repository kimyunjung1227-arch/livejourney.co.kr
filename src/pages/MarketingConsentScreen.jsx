import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';

const MarketingConsentScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    // 실제로는 사용자 설정을 불러와야겠지만, 여기서는 데모용 state 사용
    const [agreed, setAgreed] = useState(false);

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
                    <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-black dark:text-white font-display">광고/마케팅 수신 동의</h1>
                    <div className="flex size-12 shrink-0 items-center justify-end"></div>
                </header>

                <main className="flex-grow pb-4 bg-surface-light dark:bg-surface-dark">
                    <div className="p-6 space-y-6">
                        <div className="space-y-4 text-black dark:text-white">
                            <h2 className="text-xl font-bold text-black dark:text-white">마케팅 정보 수신 동의</h2>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                이벤트 및 혜택 등 다양한 정보를 이메일, 앱 푸시 알림 등으로 받아보실 수 있습니다.
                            </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-surface-subtle-light dark:bg-surface-subtle-dark rounded-xl">
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-black dark:text-white">이벤트 및 혜택 알림 받기</span>
                                <span className="text-xs text-black/60 dark:text-white/60 mt-1">앱 푸시, 이메일, SMS 포함</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    value=""
                                    className="sr-only peer"
                                    checked={agreed}
                                    onChange={() => setAgreed(!agreed)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="space-y-2 mt-8 text-black dark:text-white">
                            <h3 className="text-base font-bold">1. 수집 및 이용 목적</h3>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공
                            </p>

                            <h3 className="text-base font-bold mt-4">2. 수집 항목</h3>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                이메일 주소, 휴대전화번호, 기기정보, 앱 설치 정보
                            </p>

                            <h3 className="text-base font-bold mt-4">3. 보유 및 이용 기간</h3>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                회원 탈퇴 시 또는 동의 철회 시까지
                            </p>
                        </div>

                        <div className="pt-6 pb-2">
                            <p className="text-xs text-black/70 dark:text-white/70">
                                * 설정 &gt; 알림 설정에서도 변경하실 수 있습니다.
                            </p>
                        </div>
                    </div>
                </main>
            </div>

            <BottomNavigation />
        </div>
    );
};

export default MarketingConsentScreen;
