import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './LandingPage.css';

// 에셋 경로 (실제 환경에 맞게 조정 필요)
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
            <Header />

            {/* 1. Hero Section */}
            <section className="hero-section">
                <div className="animate-fade-in">
                    <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">LiveJourney</h1>
                    <p className="section-subtitle mx-auto">
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
            <section id="mission" className="py-32 px-6 bg-white text-center">
                <div className="max-w-4xl mx-auto mb-20">
                    <span className="text-blue-600 font-bold uppercase tracking-widest text-sm">Mission</span>
                    <h2 className="section-title mt-4">달리고 기록하는 즐거움,<br />라이브저니에서 시작해볼까요?</h2>
                    <p className="text-gray-500 text-lg">Ready to enjoy journey and sharing your moments? Start with LiveJourney!</p>
                </div>

                <div className="grid-3-col">
                    <div className="feature-card">
                        <div className="iphone-mockup mx-auto mb-8 h-96 w-48 shadow-2xl">
                            <img src={ASSETS.JEJU} alt="Past info" className="mockup-screen" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">과거는 이제 그만</h3>
                        <p className="text-gray-600 text-lg leading-relaxed">블로그의 1년 전 정보가 아닌,<br />지금 이 순간의 정보를 연결합니다.</p>
                    </div>
                    <div className="feature-card border-2 border-blue-50 transition-all hover:border-blue-200">
                        <div className="iphone-mockup mx-auto mb-8 h-96 w-48 border-blue-500 shadow-2xl">
                            <img src={ASSETS.SEONGSU} alt="Realtime Truth" className="mockup-screen" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-blue-600">실시간의 진실</h3>
                        <p className="text-gray-600 text-lg leading-relaxed">광고 없는 진짜 현장 분위기를<br />48시간 피드로 확인하세요.</p>
                    </div>
                    <div className="feature-card">
                        <div className="iphone-mockup mx-auto mb-8 h-96 w-48 shadow-2xl">
                            <img src={ASSETS.JEJU} alt="Value Step" className="mockup-screen" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">가치 있는 발걸음</h3>
                        <p className="text-gray-600 text-lg leading-relaxed">검색 시간은 1분으로,<br />여행 실패는 0으로 만듭니다.</p>
                    </div>
                </div>
            </section>

            {/* 3. Key Feature 1: 실시간 급상승 핫플 */}
            <section id="features" className="py-32 px-6 bg-blue-50">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <span className="bg-blue-600 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-md">HOT PLACE</span>
                        <h2 className="section-title mt-8">실시간 급상승 핫플 & 피드</h2>
                        <p className="text-2xl text-gray-700 font-medium leading-relaxed mb-10">
                            지금 가장 뜨거운 장소를 지도 위 핀과 실시간 사진으로 확인하세요.
                            48시간 동안 가장 반응이 뜨거웠던 <span className="text-blue-600 underline underline-offset-8">진짜 정보</span>만 모았습니다.
                        </p>
                    </div>
                    <div className="flex-1 mockup-container">
                        <div className="iphone-mockup w-72 h-[600px] border-gray-800 shadow-2xl">
                            <img src={ASSETS.SEONGSU} alt="Hot Place Map" className="mockup-screen" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Key Feature 2: 날씨 요정 (Gamification) */}
            <section className="py-32 px-6 bg-white overflow-hidden">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
                    <div className="flex-1">
                        <span className="bg-green-500 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-md">LEVEL UP</span>
                        <h2 className="section-title mt-8">날씨 요정 & 캐릭터 성장</h2>
                        <p className="text-2xl text-gray-700 font-medium leading-relaxed mb-10">
                            정보를 공유할수록 성장하는 나만의 캐릭터. <br />
                            '구름 수집가'에서 '태양의 신'까지 레벨업하는 재미를 느껴보세요.
                        </p>
                        <div className="flex gap-6">
                            {['☁️', '🌤️', '☀️'].map((emoji, idx) => (
                                <div key={idx} className="w-20 h-20 flex items-center justify-center bg-gray-50 rounded-3xl text-4xl shadow-sm border border-gray-100 hover:scale-110 transition-transform">
                                    {emoji}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 text-center relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-50 -z-10"></div>
                        <img src={ASSETS.MARIMO} alt="Marimo Evolution" className="w-80 mx-auto animate-float drop-shadow-2xl" />
                    </div>
                </div>
            </section>

            {/* 5. Community */}
            <section id="community" className="py-32 px-6 bg-gray-900 text-white relative">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="section-title text-white">숨은 명소 & 동행 커뮤니티</h2>
                    <p className="text-2xl text-gray-400 mb-16 leading-relaxed">
                        "나만의 숨은 명소를 알려주면, 다른 사람의 비밀 장소도 열립니다."<br />
                        같은 장소에 있는 사람들과 정보를 나누고 소통하세요.
                    </p>
                    <div className="flex justify-center gap-10 flex-wrap">
                        <div className="p-10 bg-white/5 border border-white/10 rounded-[40px] w-80 backdrop-blur-sm hover:bg-white/10 transition-all">
                            <span className="text-5xl mb-6 block">📍</span>
                            <h4 className="font-bold text-2xl mb-4 text-blue-400">Give & Take</h4>
                            <p className="text-gray-400 text-lg">정보를 나눌수록 더 많은 장소가 보입니다.</p>
                        </div>
                        <div className="p-10 bg-white/5 border border-white/10 rounded-[40px] w-80 backdrop-blur-sm hover:bg-white/10 transition-all">
                            <span className="text-5xl mb-6 block">🤝</span>
                            <h4 className="font-bold text-2xl mb-4 text-green-400">실시간 연결</h4>
                            <p className="text-gray-400 text-lg">현장에 있는 친구들과 동행을 찾아보세요.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Founder's Story */}
            <section className="py-48 px-6 bg-white">
                <div className="max-w-4xl mx-auto text-center italic text-gray-800">
                    <p className="text-3xl md:text-4xl leading-snug tracking-tight">
                        "어릴 적 제주도에서 겪은 아쉬움이 라이브저니의 시작이었습니다.
                        정보의 시차 때문에 여러분의 설렘이 실망으로 바뀌지 않도록,
                        <span className="text-blue-600 not-italic font-black"> 모든 여행자의 발걸음을 가치 있게 만들겠습니다.</span>"
                    </p>
                    <div className="mt-16 not-italic font-bold text-xl text-gray-900 border-t border-gray-100 pt-10 inline-block px-12">
                        LiveJourney Team
                    </div>
                </div>
            </section>

            {/* 7. Final CTA */}
            <section className="qr-section py-32">
                <h2 className="section-title mb-10">라이브저니와 함께<br />여행계의 게임체인저가 되어보세요.</h2>
                <button
                    className="btn-primary mb-16 px-12 py-5 text-xl shadow-2xl hover:shadow-blue-500/40"
                    onClick={() => navigate('/start')}
                >
                    지금 바로 시작하기
                </button>

                <div className="qr-container items-center">
                    <div className="text-center group">
                        <div className="bg-white p-6 rounded-3xl shadow-xl mb-4 inline-block group-hover:scale-105 transition-transform border border-gray-100">
                            <div className="w-32 h-32 bg-blue-50 flex items-center justify-center text-blue-300">
                                <span className="material-symbols-outlined text-5xl">qr_code_2</span>
                            </div>
                        </div>
                        <p className="font-bold text-gray-700">iOS Download</p>
                    </div>
                    <div className="text-center group">
                        <div className="bg-white p-6 rounded-3xl shadow-xl mb-4 inline-block group-hover:scale-105 transition-transform border border-gray-100">
                            <div className="w-32 h-32 bg-green-50 flex items-center justify-center text-green-300">
                                <span className="material-symbols-outlined text-5xl">qr_code_2</span>
                            </div>
                        </div>
                        <p className="font-bold text-gray-700">Android Download</p>
                    </div>
                </div>
            </section>

            <footer className="py-16 bg-gray-50 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="text-left">
                        <h4 className="text-2xl font-black text-blue-600 mb-4">LiveJourney</h4>
                        <p className="text-gray-500 mb-2">실시간 정보의 차이를 없애는 여정의 동반자</p>
                        <p className="text-gray-400 text-sm">© 2026 LiveJourney Inc. All rights reserved.</p>
                    </div>
                    <div className="flex gap-8 md:justify-end text-sm font-bold text-gray-500">
                        <button className="hover:text-blue-600">Privacy Policy</button>
                        <button className="hover:text-blue-600">Terms of Service</button>
                        <button className="hover:text-blue-600">Contact Us</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

