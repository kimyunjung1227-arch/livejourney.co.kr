import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

// 에셋 경로 (실제 환경에 맞게 조정 필요)
// 현재는 artifacts 디렉토리의 파일을 시뮬레이션
const ASSETS = {
    HERO_BG: '/landing/livejourney_hero_bg_1769598915170.png',
    MARIMO: '/landing/marimo_character_sunny_1769598937127.png',
    JEJU: '/landing/jeju_cherry_blossom_realtime_1769598960773.png',
    SEONGSU: '/landing/seongsu_crowd_realtime_1769598986616.png',
};

const LandingPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="landing-container">
            {/* 1. Hero Section */}
            <section className="hero-section">
                <div className="animate-fade-in">
                    <h1 className="text-6xl font-black mb-6">LiveJourney</h1>
                    <p className="section-subtitle">
                        정보의 시차를 없애고 실시간의 진실을 연결합니다.<br />
                        지금 당신의 눈 앞에 펼쳐진 여정을 가장 스마트하게 완성하세요.
                    </p>
                    <div className="mockup-container animate-float">
                        <div className="iphone-mockup">
                            <img src={ASSETS.JEJU} alt="Jeju Realtime" className="mockup-screen" />
                        </div>
                        <img src={ASSETS.MARIMO} alt="Marimo" className="character-marimo" />
                    </div>
                </div>
            </section>

            {/* 2. Mission & Onboarding */}
            <section className="py-24 px-6 bg-white text-center">
                <div className="max-w-4xl mx-auto mb-16">
                    <span className="text-blue-600 font-bold uppercase tracking-widest text-sm">Onboarding</span>
                    <h2 className="section-title mt-4">달리고 기록하는 즐거움,<br />라이브저니에서 시작해볼까요?</h2>
                    <p className="text-gray-500">Ready to enjoy journey and sharing your moments? Start with LiveJourney!</p>
                </div>

                <div className="grid-3-col">
                    <div className="feature-card">
                        <div className="iphone-mockup mx-auto mb-8 h-96 w-48">
                            <img src={ASSETS.JEJU} alt="Past info" className="mockup-screen" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">과거는 이제 그만</h3>
                        <p className="text-gray-600">블로그의 1년 전 정보가 아닌,<br />지금 이 순간의 정보를 연결합니다.</p>
                    </div>
                    <div className="feature-card">
                        <div className="iphone-mockup mx-auto mb-8 h-96 w-48 border-blue-500">
                            <img src={ASSETS.SEONGSU} alt="Realtime Truth" className="mockup-screen" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">실시간의 진실</h3>
                        <p className="text-gray-600">광고 없는 진짜 현장 분위기를<br />48시간 피드로 확인하세요.</p>
                    </div>
                    <div className="feature-card">
                        <div className="iphone-mockup mx-auto mb-8 h-96 w-48">
                            <img src={ASSETS.JEJU} alt="Value Step" className="mockup-screen" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">가치 있는 발걸음</h3>
                        <p className="text-gray-600">검색 시간은 1분으로,<br />여행 실패는 0으로 만듭니다.</p>
                    </div>
                </div>
            </section>

            {/* 3. Key Feature 1: 실시간 급상승 핫플 */}
            <section className="py-24 px-6 bg-blue-50">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold">HOT PLACE</span>
                        <h2 className="section-title mt-6">실시간 급상승 핫플 & 피드</h2>
                        <p className="text-xl text-gray-700 leading-relaxed mb-8">
                            지금 가장 뜨거운 장소를 지도 위 핀과 실시간 사진으로 확인하세요.
                            48시간 동안 가장 반응이 뜨거웠던 진짜 정보만 모았습니다.
                        </p>
                    </div>
                    <div className="flex-1 mockup-container">
                        <div className="iphone-mockup w-72 h-[600px] border-gray-800">
                            <img src={ASSETS.SEONGSU} alt="Hot Place Map" className="mockup-screen" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Key Feature 2: 날씨 요정 (Gamification) */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
                    <div className="flex-1">
                        <span className="bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold">LEVEL UP</span>
                        <h2 className="section-title mt-6">날씨 요정 & 캐릭터 성장</h2>
                        <p className="text-xl text-gray-700 leading-relaxed mb-8">
                            정보를 공유할수록 성장하는 나만의 캐릭터. <br />
                            '구름 수집가'에서 '태양의 신'까지 레벨업하는 재미를 느껴보세요.
                        </p>
                        <div className="flex gap-4">
                            <div className="p-4 bg-gray-100 rounded-2xl text-3xl">☁️</div>
                            <div className="p-4 bg-blue-100 rounded-2xl text-3xl">🌤️</div>
                            <div className="p-4 bg-yellow-100 rounded-2xl text-3xl">☀️</div>
                        </div>
                    </div>
                    <div className="flex-1 text-center">
                        <img src={ASSETS.MARIMO} alt="Marimo Evolution" className="w-80 mx-auto animate-float" />
                    </div>
                </div>
            </section>

            {/* 5. Community */}
            <section className="py-24 px-6 bg-gray-900 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="section-title text-white">숨은 명소 & 동행 커뮤니티</h2>
                    <p className="text-xl text-gray-400 mb-12">
                        "나만의 숨은 명소를 알려주면, 다른 사람의 비밀 장소도 열립니다."<br />
                        같은 장소에 있는 사람들과 정보를 나누고 소통하세요.
                    </p>
                    <div className="flex justify-center gap-8 flex-wrap">
                        <div className="p-8 border border-gray-700 rounded-3xl w-64">
                            <span className="text-4xl mb-4 block">📍</span>
                            <h4 className="font-bold text-xl mb-2">Give & Take</h4>
                            <p className="text-gray-500 text-sm">정보를 나눌수록 더 많은 장소가 보입니다.</p>
                        </div>
                        <div className="p-8 border border-gray-700 rounded-3xl w-64">
                            <span className="text-4xl mb-4 block">🤝</span>
                            <h4 className="font-bold text-xl mb-2">실시간 연결</h4>
                            <p className="text-gray-500 text-sm">현장에 있는 친구들과 동행을 찾아보세요.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Founder's Story */}
            <section className="py-40 px-6 bg-white">
                <div className="max-w-3xl mx-auto text-center italic text-gray-800">
                    <p className="text-2xl leading-loose">
                        "어릴 적 제주도에서 겪은 아쉬움이 라이브저니의 시작이었습니다.
                        정보의 시차 때문에 여러분의 설렘이 실망으로 바뀌지 않도록,
                        모든 여행자의 발걸음을 가치 있게 만들겠습니다."
                    </p>
                    <div className="mt-12 not-italic font-bold text-gray-900 border-t pt-8 inline-block px-12">
                        LiveJourney Team
                    </div>
                </div>
            </section>

            {/* 7. Final CTA */}
            <section className="qr-section">
                <h2 className="section-title">라이브저니와 함께<br />여행계의 게임체인저가 되어보세요.</h2>
                <button className="btn-primary mb-12" onClick={() => navigate('/start')}>
                    지금 바로 시작하기
                </button>

                <div className="qr-container">
                    <div className="text-center">
                        <div className="bg-white p-4 rounded-2xl shadow-lg mb-4 inline-block">
                            <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-400">QR Code</div>
                        </div>
                        <p className="font-bold">iOS</p>
                    </div>
                    <div className="text-center">
                        <div className="bg-white p-4 rounded-2xl shadow-lg mb-4 inline-block">
                            <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-400">QR Code</div>
                        </div>
                        <p className="font-bold">Android</p>
                    </div>
                </div>
            </section>

            <footer className="py-12 bg-white border-t text-center text-gray-400 text-sm">
                © 2026 LiveJourney. All rights reserved.
            </footer>
        </div>
    );
};

export default LandingPage;
