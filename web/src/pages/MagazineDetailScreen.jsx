import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const MagazineDetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const { magazine } = state;

  if (!magazine) {
    return (
      <div className="screen-layout bg-background-light dark:bg-background-dark h-screen overflow-hidden">
        <div className="screen-content flex flex-col h-full">
          <div className="screen-header flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
            <button
              onClick={() => navigate(-1)}
              className="flex size-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <h1 className="text-[18px] font-bold text-text-primary-light dark:text-text-primary-dark m-0">
              여행 매거진
            </h1>
            <div className="w-10" />
          </div>
          <main className="flex-1 flex flex-col items-center justify-center px-4">
            <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">
              book_5
            </span>
            <p className="text-[15px] font-medium text-gray-800 dark:text-gray-100 mb-1">
              매거진 정보를 불러올 수 없어요
            </p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center">
              메인 화면에서 다시 선택해 주세요.
            </p>
          </main>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const createdDate = magazine.createdAt
    ? new Date(magazine.createdAt).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : null;

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark h-screen overflow-hidden">
      <div className="screen-content flex flex-col h-full">
        {/* 헤더 */}
        <div className="screen-header flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="flex size-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 className="text-[18px] font-bold text-text-primary-light dark:text-text-primary-dark m-0">
            여행 매거진
          </h1>
          <div className="w-10" />
        </div>

        {/* 스크롤 가능한 본문 */}
        <main className="flex-1 overflow-y-auto">
          {/* 커버 영역 */}
          <div className="mt-4 mx-4 rounded-2xl overflow-hidden bg-gray-200 relative">
            <div
              style={{
                width: '100%',
                height: 220,
                backgroundImage: magazine.coverImage
                  ? `url("${magazine.coverImage}")`
                  : `url("https://source.unsplash.com/featured/?${encodeURIComponent(
                    (magazine.regionName || 'travel') + ' landscape'
                  )}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="absolute left-4 bottom-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-[11px] font-semibold inline-flex items-center gap-1.5">
              <span>📖</span>
              <span>여행 매거진</span>
            </div>
          </div>

          {/* 제목 / 요약 / 메타 */}
          <section className="px-4 pt-5 pb-3">
            <h2 className="text-[22px] font-bold text-gray-900 leading-snug mb-2">
              {magazine.title}
            </h2>
            {magazine.summary && (
              <p className="text-[14px] text-gray-600 leading-relaxed mb-3">
                {magazine.summary}
              </p>
            )}

            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-[16px]">
                  ✈️
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-gray-900">
                    {magazine.author || 'LiveJourney'}
                  </div>
                  {magazine.regionName && (
                    <div className="text-[11px] text-gray-500">
                      {magazine.regionName} 여행
                    </div>
                  )}
                </div>
              </div>
              {createdDate && (
                <div className="text-[11px] text-gray-400">
                  {createdDate}
                </div>
              )}
            </div>

            {/* 현재 사진 보기 버튼 */}
            {magazine.regionName && (
              <button
                onClick={() =>
                  navigate(`/region/${magazine.regionName}`, {
                    state: {
                      region: { name: magazine.regionName },
                      focusLocation: magazine.detailedLocation || magazine.regionName,
                    },
                  })
                }
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-md hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">
                  photo_library
                </span>
                <span>{magazine.regionName} 지금 사진 보기</span>
              </button>
            )}
          </section>

          {/* 섹션 단위 컨텐츠 (텍스트 + 사진) */}
          <section className="px-4 pb-8 space-y-6">
            {Array.isArray(magazine.content) && magazine.content.length > 0 ? (
              magazine.content.map((block, index) => {
                if (block.type === 'image') {
                  return (
                    <figure key={index} className="rounded-2xl overflow-hidden bg-gray-100">
                      <div
                        style={{
                          width: '100%',
                          height: 200,
                          backgroundImage: `url("${block.imageUrl}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      {block.caption && (
                        <figcaption className="px-3 py-2 text-[12px] text-gray-600 bg-white">
                          {block.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                }

                return (
                  <article key={index} className="space-y-2">
                    {block.title && (
                      <h3 className="text-[15px] font-semibold text-gray-900">
                        {block.title}
                      </h3>
                    )}
                    {block.body && (
                      <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-line">
                        {block.body}
                      </p>
                    )}
                  </article>
                );
              })
            ) : (
              <p className="text-[15px] text-gray-900 leading-relaxed whitespace-pre-line">
                {magazine.content ||
                  '아직 준비 중인 매거진입니다.\n\n곧 이 지역을 어떻게 돌면 좋은지, 하루 동선과 숨겨진 스팟들을 담은 여행 매거진이 업데이트될 예정이에요.'}
              </p>
            )}
          </section>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MagazineDetailScreen;


