import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';

const InquiryScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 폼 상태
  const [inquiryType, setInquiryType] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [attachment, setAttachment] = useState(null);

  // 유효성 검사
  const isFormValid = () => {
    return inquiryType && 
           title.trim() && 
           content.trim() && 
           email.trim() && 
           agreedToPrivacy;
  };

  const handleFileAttachment = () => {
    // TODO: 실제 파일 업로드 기능 구현
    alert('파일 첨부 기능은 추후 구현 예정입니다.');
  };

  const handleInquiryHistory = () => {
    // TODO: 문의 내역 페이지로 이동
    alert('문의 내역 기능은 추후 구현 예정입니다.');
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      alert('모든 필수 항목을 입력하고 개인정보 처리 방침에 동의해주세요.');
      return;
    }

    // TODO: 실제 백엔드 API 호출하여 문의 접수
    alert(`문의가 접수되었습니다.\n\n유형: ${inquiryType}\n제목: ${title}\n이메일: ${email}\n\n답변은 영업일 기준 1-2일 내에 등록하신 이메일로 발송됩니다.`);
    
    // 폼 초기화
    setInquiryType('');
    setTitle('');
    setContent('');
    setEmail(user?.email || '');
    setAgreedToPrivacy(false);
    setAttachment(null);
    
    navigate('/settings');
  };

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark group/design-root">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-light bg-surface-light/80 dark:border-border-dark dark:bg-surface-dark/80 backdrop-blur-sm px-4">
        <button
          onClick={() => navigate('/settings')}
          className="flex size-12 shrink-0 items-center justify-center cursor-pointer text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">문의하기</h1>
        <div className="flex size-auto shrink-0 items-center justify-end">
          <button
            onClick={handleInquiryHistory}
            className="text-sm font-medium text-content-light dark:text-content-dark px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            문의 내역
          </button>
        </div>
      </header>

        <main className="flex-grow pb-4">
        <div className="flex flex-col">
          {/* 문의 안내 섹션 */}
          <section className="bg-surface-light dark:bg-surface-dark px-4 pt-8 pb-6">
            <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">문의 안내</h2>
            <p className="mt-2 text-sm text-subtle-light dark:text-subtle-dark">
              문의 전 자주 묻는 질문(FAQ)를 확인하시면 더 빠르게 궁금증을 해결하실 수 있습니다. 궁금한 점이 해결되지 않을 경우 문의를 남겨주세요.
            </p>
            <button
              onClick={() => navigate('/faq')}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <span>자주 묻는 질문(FAQ) 바로가기</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </section>

          <div className="h-2 bg-background-light dark:bg-background-dark"></div>

          {/* 문의 양식 섹션 */}
          <section className="bg-surface-light dark:bg-surface-dark px-4 py-8">
            <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">문의 양식</h2>
            
            <div className="mt-6 flex flex-col gap-6">
              {/* 문의 유형 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-content-light dark:text-content-dark" htmlFor="inquiry-type">
                  문의 유형 <span className="text-primary">*</span>
                </label>
                <select
                  className="custom-select block w-full rounded-lg border-border-light bg-surface-subtle-light p-3 text-base placeholder:text-subtle-light focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-surface-subtle-dark dark:placeholder:text-subtle-dark"
                  id="inquiry-type"
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  style={{
                    color: inquiryType ? 'var(--content-light)' : 'var(--subtle-light)'
                  }}
                >
                  <option value="">문의 유형을 선택해주세요</option>
                  <option value="계정 관련">계정 관련</option>
                  <option value="서비스 이용">서비스 이용</option>
                  <option value="오류/버그 신고">오류/버그 신고</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              {/* 제목 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-content-light dark:text-content-dark" htmlFor="title">
                  제목 <span className="text-primary">*</span>
                </label>
                <input
                  className="block w-full rounded-lg border-border-light bg-surface-subtle-light p-3 text-base text-content-light placeholder:text-subtle-light focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-surface-subtle-dark dark:text-content-dark dark:placeholder:text-subtle-dark"
                  id="title"
                  placeholder="제목을 입력해주세요"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-content-light dark:text-content-dark" htmlFor="content">
                  내용 <span className="text-primary">*</span>
                </label>
                <textarea
                  className="block w-full resize-none rounded-lg border-border-light bg-surface-subtle-light p-3 text-base text-content-light placeholder:text-subtle-light focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-surface-subtle-dark dark:text-content-dark dark:placeholder:text-subtle-dark"
                  id="content"
                  placeholder="문의하실 내용을 입력해주세요"
                  rows="6"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* 답변 받을 이메일 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-content-light dark:text-content-dark" htmlFor="email">
                  답변 받을 이메일 <span className="text-primary">*</span>
                </label>
                <input
                  className="block w-full rounded-lg border-border-light bg-surface-subtle-light p-3 text-base text-content-light placeholder:text-subtle-light focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-surface-subtle-dark dark:text-content-dark dark:placeholder:text-subtle-dark"
                  id="email"
                  placeholder="이메일 주소를 입력해주세요"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* 첨부 파일 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-content-light dark:text-content-dark" htmlFor="attachment">
                  첨부 파일
                </label>
                <button
                  onClick={handleFileAttachment}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-light bg-surface-light px-4 py-3 text-base font-medium text-content-light dark:border-border-dark dark:bg-surface-dark dark:text-content-dark hover:bg-surface-subtle-light dark:hover:bg-surface-subtle-dark transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">attachment</span>
                  <span>파일 첨부하기</span>
                </button>
              </div>
            </div>
          </section>

          <div className="h-2 bg-background-light dark:bg-background-dark"></div>

          {/* 개인정보 처리 방침 동의 */}
          <section className="bg-surface-light dark:bg-surface-dark px-4 py-8">
            <div className="flex items-start">
              <input
                className="mt-1 size-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
                id="privacy-policy"
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
              />
              <div className="ml-3">
                <label className="text-sm font-medium text-content-light dark:text-content-dark cursor-pointer" htmlFor="privacy-policy">
                  개인 정보 처리 방침 동의 (필수)
                </label>
                <p className="text-sm text-subtle-light dark:text-subtle-dark">
                  문의 처리를 위한 최소한의 개인 정보를 수집 및 이용합니다.{' '}
                  <button
                    onClick={() => alert('개인정보 처리 방침 상세 페이지는 추후 구현 예정입니다.')}
                    className="font-medium text-content-light underline dark:text-content-dark hover:text-primary dark:hover:text-primary transition-colors"
                  >
                    자세히보기
                  </button>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 문의 접수 버튼 */}
      <div className="flex-shrink-0 bg-surface-light p-4 dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className={`w-full rounded-full py-4 text-base font-bold text-white transition-colors ${
            isFormValid()
              ? 'bg-primary hover:bg-primary/90 cursor-pointer'
              : 'bg-primary/40 cursor-not-allowed'
          }`}
        >
          문의 접수
        </button>
      </div>
      </div>

      <BottomNavigation />

      <style>{`
        .custom-select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238a7560' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
        
        .dark .custom-select {
          color: var(--content-dark);
        }
      `}</style>
    </div>
  );
};

export default InquiryScreen;



