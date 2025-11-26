import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const FAQScreen = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [expandedFAQ, setExpandedFAQ] = useState(3); // 기본적으로 3번 질문이 펼쳐진 상태

  // 카테고리 목록
  const categories = ['전체', '계정', '서비스 이용', '오류 및 기타', '결제', '예약'];

  // FAQ 데이터
  const faqs = [
    {
      id: 1,
      category: '계정',
      question: '계정은 어떻게 만드나요?',
      answer: 'LiveJourney 앱을 다운로드한 후, 이메일 또는 소셜 로그인(구글, 카카오, 네이버)을 통해 간편하게 계정을 생성할 수 있습니다. 가입 후 프로필 정보를 입력하면 모든 기능을 이용하실 수 있습니다.'
    },
    {
      id: 2,
      category: '계정',
      question: '비밀번호를 잊어버렸어요.',
      answer: '로그인 화면에서 "비밀번호 찾기"를 선택하신 후, 가입 시 등록한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 발송해 드립니다. 이메일을 확인하여 새로운 비밀번호를 설정해주세요.'
    },
    {
      id: 3,
      category: '서비스 이용',
      question: 'LiveJourney 앱의 주요 기능은 무엇인가요?',
      answer: 'LiveJourney는 실시간 위치 공유, 여행 계획 및 기록, 현지 정보 제공 등 다양한 기능을 통해 사용자에게 편리하고 즐거운 여행 경험을 제공합니다. 사용자는 친구나 가족과 실시간으로 위치를 공유하며 안전하게 여행할 수 있고, 여행 경로를 계획하고 기록하여 추억을 남길 수 있습니다.'
    },
    {
      id: 4,
      category: '오류 및 기타',
      question: '앱 사용 중 오류가 발생했어요.',
      answer: '앱 사용 중 오류가 발생하면 다음 절차를 따라주세요: 1) 앱을 완전히 종료 후 재시작, 2) 최신 버전으로 업데이트, 3) 기기 재부팅. 문제가 지속되면 설정 > 문의하기를 통해 오류 내용과 스크린샷을 보내주시면 빠르게 해결해드리겠습니다.'
    },
    {
      id: 5,
      category: '결제',
      question: '결제 수단은 어떤 것들이 있나요?',
      answer: 'LiveJourney는 신용카드(VISA, MasterCard, JCB), 체크카드, 간편결제(카카오페이, 네이버페이, 토스), 계좌이체 등 다양한 결제 수단을 지원합니다. 쿠폰함에서 상품을 이용하실 때 편리하게 사용하실 수 있습니다.'
    },
    {
      id: 6,
      category: '예약',
      question: '예약한 상품은 어떻게 확인하나요?',
      answer: '프로필 > 마이 쿠폰함 메뉴에서 교환하신 모든 쿠폰과 예약 내역을 확인하실 수 있습니다. 각 쿠폰의 유효기간, 사용 조건 등의 상세 정보도 함께 제공됩니다.'
    },
    {
      id: 7,
      category: '서비스 이용',
      question: '뱃지는 어떻게 획득하나요?',
      answer: '뱃지는 여행지 사진 업로드, 특정 지역 방문, 카테고리별 활동 등 다양한 조건을 달성하면 자동으로 획득됩니다. 획득한 뱃지는 프로필에서 확인할 수 있으며, 각 뱃지마다 난이도가 있어 도전 목표가 됩니다.'
    },
    {
      id: 8,
      category: '서비스 이용',
      question: '위치 정보는 어떻게 공유하나요?',
      answer: '지도 화면에서 실시간으로 위치를 공유할 수 있습니다. 설정에서 위치 정보 접근 권한을 허용하신 후, 원하시는 친구나 그룹을 선택하여 위치를 공유하실 수 있습니다. 언제든지 공유를 중단하거나 재개할 수 있습니다.'
    }
  ];

  // 검색 및 카테고리 필터링
  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === '전체' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleInquiry = () => {
    navigate('/inquiry');
  };

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark group/design-root">
      <div className="screen-content">
        <header className="screen-header flex h-16 items-center justify-between border-b border-border-light bg-white dark:border-border-dark dark:bg-gray-900 px-4 shadow-sm">
        <button
          onClick={() => navigate('/settings')}
          className="flex size-12 shrink-0 items-center justify-center cursor-pointer text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">자주 묻는 질문 (FAQ)</h1>
        <div className="flex size-12 shrink-0 items-center justify-end"></div>
      </header>

      <main className="flex-grow pb-24">
        {/* 검색창 및 카테고리 필터 */}
        <div className="flex flex-col bg-surface-light dark:bg-surface-dark">
          <div className="px-4 pt-6 pb-4">
            <div className="relative">
              <input
                className="w-full h-12 rounded-lg border border-border-light bg-surface-subtle-light dark:bg-surface-subtle-dark dark:border-border-dark pl-10 pr-4 text-content-light dark:text-content-dark placeholder-subtle-light dark:placeholder-subtle-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="궁금한 점을 검색해보세요"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-subtle-light dark:text-subtle-dark">
                search
              </span>
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="w-full overflow-x-auto no-scrollbar py-2">
            <div className="flex space-x-2 px-4 whitespace-nowrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-surface-subtle-light text-content-light dark:bg-surface-subtle-dark dark:text-content-dark hover:bg-surface-subtle-light/80 dark:hover:bg-surface-subtle-dark/80'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-2 bg-background-light dark:bg-background-dark"></div>

        {/* FAQ 리스트 */}
        <div className="bg-surface-light dark:bg-surface-dark flex flex-col">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className={`border-b border-border-light dark:border-border-dark ${
                  expandedFAQ === faq.id ? 'bg-surface-subtle-light dark:bg-surface-subtle-dark' : ''
                }`}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full flex h-16 items-center justify-between px-4 cursor-pointer hover:bg-surface-subtle-light dark:hover:bg-surface-subtle-dark transition-colors"
                >
                  <p className="text-base font-medium leading-normal text-content-light dark:text-content-dark text-left">
                    <span className="text-primary mr-1">Q.</span>
                    {faq.question}
                  </p>
                  <span className={`material-symbols-outlined ${expandedFAQ === faq.id ? 'text-content-light dark:text-content-dark' : 'text-subtle-light dark:text-subtle-dark'}`}>
                    {expandedFAQ === faq.id ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {expandedFAQ === faq.id && (
                  <div className="p-4 pt-0 text-subtle-light dark:text-subtle-dark text-sm leading-6">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-subtle-light dark:text-subtle-dark">
                검색 결과가 없습니다.
              </p>
            </div>
          )}
        </div>

        {/* 1:1 문의하기 */}
        <div className="px-4 py-8 text-center bg-background-light dark:bg-background-dark">
          <p className="text-sm text-subtle-light dark:text-subtle-dark">찾으시는 답변이 없으신가요?</p>
          <button
            onClick={handleInquiry}
            className="mt-2 inline-block text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            1:1 문의하기
          </button>
        </div>
      </main>

      </div>

      <BottomNavigation />

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default FAQScreen;



