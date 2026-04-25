import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const PrivacyPolicyScreen = () => {
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
                    <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-black dark:text-white font-display">개인정보 처리방침</h1>
                    <div className="flex size-12 shrink-0 items-center justify-end"></div>
                </header>

                <main className="flex-grow pb-4 bg-surface-light dark:bg-surface-dark">
                    <div className="p-6 space-y-6">
                        {/* 제1조 */}
                        <div className="space-y-4 text-black dark:text-white">
                            <h2 className="text-xl font-bold text-black dark:text-white">제1조 (목적)</h2>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                LiveJourney(이하 "회사")는 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리지침을 수립·공개합니다.
                            </p>
                        </div>

                        {/* 제2조 */}
                        <div className="space-y-4 text-black dark:text-white">
                            <h2 className="text-xl font-bold text-black dark:text-white">제2조 (개인정보의 처리목적)</h2>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                            </p>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                1. 홈페이지 회원 가입 및 관리<br />
                                회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 제한적 본인확인제 시행에 따른 본인확인, 서비스 부정이용 방지, 각종 고지·통지, 고충처리 등을 목적으로 개인정보를 처리합니다.
                            </p>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                2. 재화 또는 서비스 제공<br />
                                물품배송, 서비스 제공, 청구서 발송, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 연령인증, 요금결제·정산, 채권추심 등을 목적으로 개인정보를 처리합니다.
                            </p>
                        </div>

                        {/* 제3조 */}
                        <div className="space-y-4 text-black dark:text-white">
                            <h2 className="text-xl font-bold text-black dark:text-white">제3조 (개인정보의 처리 및 보유기간)</h2>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                ① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
                            </p>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.<br />
                                1. 홈페이지 회원 가입 및 관리 : 사업자/단체 홈페이지 탈퇴시까지<br />
                                다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료시까지<br />
                                - 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료시까지<br />
                                - 홈페이지 이용에 따른 채권·채무관계 잔존시에는 해당 채권·채무관계 정산시까지
                            </p>
                        </div>

                        {/* 제4조 */}
                        <div className="space-y-4 text-black dark:text-white">
                            <h2 className="text-xl font-bold text-black dark:text-white">제4조 (정보주체의 권리·의무 및 행사방법)</h2>
                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                ① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.<br />
                                1. 개인정보 열람요구<br />
                                2. 오류 등이 있을 경우 정정 요구<br />
                                3. 삭제요구<br />
                                4. 처리정지 요구
                            </p>
                        </div>

                        {/* 시행일자 */}
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

export default PrivacyPolicyScreen;
