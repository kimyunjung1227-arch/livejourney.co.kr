import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const YouthPolicyScreen = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark group/design-root">
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-light bg-surface-light/80 dark:border-border-dark dark:bg-surface-dark/80 backdrop-blur-sm px-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex size-12 shrink-0 items-center justify-start cursor-pointer text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-black dark:text-white font-display">청소년 보호정책</h1>
                    <div className="flex size-12 shrink-0 items-center justify-end"></div>
                </header>

                <main className="flex-grow pb-4 bg-surface-light dark:bg-surface-dark">
                    <div className="p-6 space-y-6">
                        <div className="space-y-4 text-black dark:text-white">
                            <h2 className="text-xl font-bold text-black dark:text-white">1. 청소년 보호 정책의 개요</h2>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                회사는 청소년이 건전한 인격체로 성장할 수 있도록 하기 위하여 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 청소년보호법에 근거하여 청소년 보호정책을 수립·시행하고 있습니다.
                            </p>
                        </div>

                        <div className="space-y-4 text-black dark:text-white">
                            <h2 className="text-xl font-bold text-black dark:text-white">2. 청소년 유해정보로부터의 청소년 보호계획 수립 및 시행</h2>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                회사는 청소년이 아무런 제약 없이 유해정보에 노출되지 않도록 청소년 유해 매체물에 대해서는 별도의 인증 장치를 마련·적용하며 청소년 유해정보가 노출되지 않도록 예방 차단의 조치를 강구합니다.
                            </p>
                        </div>

                        <div className="space-y-4 text-black dark:text-white">
                            <h2 className="text-xl font-bold text-black dark:text-white">3. 청소년 보호책임자 및 담당자 연락처</h2>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                회사는 청소년들이 좋은 정보를 안전하게 이용할 수 있도록 최선을 다하고 있습니다. 청소년 보호와 관련하여 문의사항이 있으시면 아래의 담당자에게 알려주십시오.<br /><br />
                                <strong>청소년 보호 책임자</strong><br />
                                이름: 관리자<br />
                                소속: LiveJourney 운영팀<br />
                                전화: 02-1234-5678<br />
                                이메일: clean@livejourney.com
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

export default YouthPolicyScreen;
