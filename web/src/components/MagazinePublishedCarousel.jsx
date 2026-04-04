import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { getTimeAgo } from '../utils/timeUtils';
import { getMapThumbnailUri } from '../utils/postMedia';
import { mediaUrlsFromPost, normalizeSpace } from '../utils/magazinePublishedUi';
import MagazineFieldVoices from './MagazineFieldVoices';

/** PostDetailScreen 미디어 스와이프와 동일 */
const SWIPER_SPEED = 280;
const SWIPER_RESISTANCE = 0.85;

const collectHeroUrls = (slide, regionPosts) => {
  const set = new Set();
  if (slide?.image) set.add(slide.image);
  const posts = Array.isArray(regionPosts) ? regionPosts : [];
  posts.forEach((p) => {
    mediaUrlsFromPost(p).forEach((u) => u && set.add(u));
    const thumb = getMapThumbnailUri(p);
    if (thumb) set.add(thumb);
  });
  return [...set].filter(Boolean).slice(0, 5);
};

/** 대표 사진(최대 5장) — 게시물 상세와 동일한 Swiper 설정 */
function HeroRotator({ urls, resetKey, timeLabel }) {
  const safe = useMemo(() => (Array.isArray(urls) ? urls.filter(Boolean).slice(0, 5) : []), [urls]);
  const swiperRef = useRef(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
    const s = swiperRef.current;
    if (s) s.slideTo(0, 0);
  }, [resetKey]);

  if (!safe.length) {
    return (
      <div className="relative flex min-h-[200px] w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
        <span className="material-symbols-outlined text-5xl text-zinc-400">photo</span>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
      <div className="relative aspect-[3/4] max-h-[min(300px,42dvh)] w-full">
        <Swiper
          nested
          touchReleaseOnEdges
          key={resetKey}
          onSwiper={(s) => {
            swiperRef.current = s;
          }}
          onSlideChange={(s) => setIdx(s.activeIndex)}
          initialSlide={0}
          speed={SWIPER_SPEED}
          resistanceRatio={SWIPER_RESISTANCE}
          className="h-full w-full"
        >
          {safe.map((src, i) => (
            <SwiperSlide key={`${resetKey}-hero-${i}`} className="!flex h-full">
              <div className="relative h-full min-h-0 w-full min-w-0 flex-1 bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-col gap-2">
          <span className="inline-flex rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white shadow-md shadow-primary/30">
            {timeLabel}
          </span>
        </div>
        {safe.length > 1 && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
            {safe.map((_, i) => (
              <span
                key={`dot-${i}`}
                className={`block shrink-0 rounded-full transition-all duration-200 ease-out ${
                  i === idx ? 'h-1.5 w-5 bg-white' : 'h-1.5 w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 발행 매거진: 장소별 Swiper(게시물 상세와 동일) + 본문 블록 순서
 */
const MagazinePublishedCarousel = ({ slides, postsPerSlide = [], variant = 'list' }) => {
  const navigate = useNavigate();
  const placesSwiperRef = useRef(null);
  const [placeSlideIdx, setPlaceSlideIdx] = useState(0);

  const slidesStableKey = useMemo(
    () => (slides || []).map((s, i) => `${i}-${s?.sectionIndex ?? ''}-${s?.placeTitle ?? ''}`).join('|'),
    [slides]
  );

  useEffect(() => {
    setPlaceSlideIdx(0);
    placesSwiperRef.current?.slideTo(0, 0);
  }, [slidesStableKey]);

  const scrollToPlaceSlide = useCallback((index) => {
    const s = placesSwiperRef.current;
    if (!s || !slides.length) return;
    const i = Math.max(0, Math.min(index, slides.length - 1));
    s.slideTo(i);
    setPlaceSlideIdx(i);
  }, [slides.length]);

  const handleFeaturedClick = (slide) => {
    if (variant === 'detail') return;
    if (slide?.kind === 'magazine' && slide.mag?.id) {
      navigate(`/magazine/${slide.mag.id}`, { state: { magazine: slide.mag } });
    } else if (slide?.postId) {
      navigate(`/post/${slide.postId}`);
    } else {
      navigate('/search');
    }
  };

  const handleAskLight = (e, slide) => {
    e?.stopPropagation?.();
    const placeTitle = String(slide?.placeTitle || '').trim() || '이 장소';
    const askQuery = String(slide?.askQuery || slide?.placeTitle || '').trim() || placeTitle;
    navigate('/chat', {
      state: {
        magazineAsk: {
          placeTitle,
          askQuery,
          presetMessage: `${placeTitle} 지금 붐비나요? 웨이팅·주차 알려주세요.`,
        },
      },
    });
  };

  if (!slides.length) return null;

  return (
    <div className="w-full">
      <h2 className="mb-3 text-xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
        {slides[0]?.magTitle}
      </h2>

      <Swiper
        key={slidesStableKey}
        onSwiper={(sw) => {
          placesSwiperRef.current = sw;
        }}
        onSlideChange={(sw) => setPlaceSlideIdx(sw.activeIndex)}
        slidesPerView={1}
        spaceBetween={0}
        speed={SWIPER_SPEED}
        resistanceRatio={SWIPER_RESISTANCE}
        className="w-full min-w-0 overflow-hidden"
        role="region"
        aria-label="장소별 매거진 슬라이드"
      >
        {slides.map((slide, i) => {
          const regionPosts = Array.isArray(postsPerSlide[i]) ? postsPerSlide[i] : [];
          const heroUrls = collectHeroUrls(slide, regionPosts);
          const heroResetKey = `${slide.sectionIndex}-${i}`;

          const sectionHeading = slide.sectionLabel || `장소 ${(slide.sectionIndex ?? i) + 1}`;

          return (
            <SwiperSlide
              key={`slide-${slide.sectionIndex}-${i}`}
              className="!box-border w-full min-w-0 max-w-full shrink-0 px-0"
            >
              <article className="w-full max-w-full pb-1">
                {variant === 'detail' ? (
                  <div className="w-full max-w-full overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-gray-900">
                    {/* 1. 장소 위치 */}
                    <div className="px-4 pt-4 pb-2">
                      <p className="mb-1 m-0 text-[11px] font-extrabold uppercase tracking-wide text-primary">
                        {sectionHeading}
                      </p>
                      <h3 className="m-0 text-lg font-extrabold leading-snug text-gray-900 dark:text-gray-50">
                        {slide.placeTitle}
                      </h3>
                      {slide.locationInfoLine ? (
                        <p className="mt-1.5 m-0 text-[12px] font-medium text-gray-500 dark:text-gray-400">
                          {slide.locationInfoLine}
                        </p>
                      ) : null}
                    </div>

                    {/* 2. 대표 사진 최대 5장 */}
                    <HeroRotator urls={heroUrls} resetKey={heroResetKey} timeLabel={slide.timeLabel} />

                    <div className="space-y-3 p-4 pt-3">
                      {/* 3. 장소 설명 */}
                      <p className="m-0 text-[14px] leading-relaxed text-gray-600 dark:text-gray-300">
                        {slide.description}
                      </p>

                      {slide.regionSummary ? (
                        <div className="rounded-lg bg-cyan-50/70 px-2.5 py-1.5 text-[11px] text-cyan-900 dark:bg-cyan-950/35 dark:text-cyan-100">
                          <span className="mr-1 font-semibold">AI 요약</span>
                          {slide.regionSummary}
                        </div>
                      ) : null}

                      {/* 4. 현장 기록(사진·글) */}
                      {Array.isArray(slide.fieldVoices) && slide.fieldVoices.length > 0 ? (
                        <MagazineFieldVoices voices={slide.fieldVoices} />
                      ) : null}

                      {/* 5. 주변 맛집·명소 AI 추천 */}
                      {Array.isArray(slide.aroundDisplay) && slide.aroundDisplay.length > 0 ? (
                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/90 p-3 dark:border-zinc-700 dark:bg-zinc-900/45">
                          <h4 className="m-0 mb-0.5 text-[13px] font-bold text-gray-900 dark:text-gray-50">
                            주변 맛집 · 명소 추천
                          </h4>
                          <p className="m-0 mb-2.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                            입력하신 장소의 지역을 기준으로 AI가 골랐어요. 피드에 사진이 있으면 썸네일이 붙어요.
                          </p>
                          <div className="-mx-0.5 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {slide.aroundDisplay.map((ar) => (
                              <div
                                key={ar.id}
                                className="w-[132px] shrink-0 overflow-hidden rounded-xl border border-white/80 bg-white shadow-sm dark:border-zinc-600 dark:bg-zinc-900/60"
                              >
                                <div className="relative aspect-[4/3] bg-zinc-200 dark:bg-zinc-800">
                                  {ar.image ? (
                                    <img src={ar.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                      <span className="material-symbols-outlined text-2xl">storefront</span>
                                    </div>
                                  )}
                                </div>
                                <div className="px-2 py-1.5">
                                  <p className="m-0 truncate text-[11px] font-bold text-gray-900 dark:text-gray-50">{ar.name}</p>
                                  {ar.desc ? (
                                    <p className="m-0 mt-0.5 line-clamp-2 text-[10px] leading-snug text-gray-500 dark:text-gray-400">
                                      {ar.desc}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={(e) => handleAskLight(e, slide)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/35 bg-primary/[0.07] py-2.5 px-3 text-[13px] font-semibold text-primary shadow-none transition hover:bg-primary/12 active:scale-[0.99] dark:border-primary/45 dark:bg-primary/10 dark:text-primary"
                      >
                        <span
                          className="material-symbols-outlined text-[17px] text-primary"
                          style={{ fontVariationSettings: '"FILL" 0' }}
                        >
                          chat_bubble
                        </span>
                        지금 여기 장소에 대해 물어보기
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-full max-w-full overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-gray-900">
                      <div className="px-4 pt-4 pb-2">
                        <p className="mb-1 m-0 text-[11px] font-extrabold uppercase tracking-wide text-primary">
                          {sectionHeading}
                        </p>
                        <h3 className="m-0 text-lg font-extrabold leading-snug text-gray-900 dark:text-gray-50">
                          {slide.placeTitle}
                        </h3>
                        {slide.locationInfoLine ? (
                          <p className="mt-1.5 m-0 text-[12px] font-medium text-gray-500 dark:text-gray-400">
                            {slide.locationInfoLine}
                          </p>
                        ) : null}
                      </div>
                      <HeroRotator urls={heroUrls} resetKey={heroResetKey} timeLabel={slide.timeLabel} />
                      <div className="space-y-3 p-4 pt-3">
                        <p className="m-0 text-[14px] leading-relaxed text-gray-600 dark:text-gray-300">
                          {slide.description}
                        </p>
                        {slide.regionSummary ? (
                          <div className="rounded-lg bg-cyan-50/70 px-2.5 py-1.5 text-[11px] text-cyan-900 dark:bg-cyan-950/35 dark:text-cyan-100">
                            <span className="mr-1 font-semibold">AI 요약</span>
                            {slide.regionSummary}
                          </div>
                        ) : null}
                        {Array.isArray(slide.fieldVoices) && slide.fieldVoices.length > 0 ? (
                          <MagazineFieldVoices voices={slide.fieldVoices} />
                        ) : null}
                        <button
                          type="button"
                          onClick={(e) => handleAskLight(e, slide)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/35 bg-primary/[0.07] py-2.5 px-3 text-[13px] font-semibold text-primary shadow-none transition hover:bg-primary/12 active:scale-[0.99] dark:border-primary/45 dark:bg-primary/10 dark:text-primary"
                        >
                          <span
                            className="material-symbols-outlined text-[17px] text-primary"
                            style={{ fontVariationSettings: '"FILL" 0' }}
                          >
                            chat_bubble
                          </span>
                          지금 여기 장소에 대해 물어보기
                        </button>
                        {Array.isArray(slide.aroundDisplay) && slide.aroundDisplay.length > 0 ? (
                          <div className="rounded-xl border border-zinc-100 bg-zinc-50/90 p-3 dark:border-zinc-700 dark:bg-zinc-900/45">
                            <h4 className="m-0 mb-0.5 text-[13px] font-bold text-gray-900 dark:text-gray-50">
                              주변 맛집 · 명소 추천
                            </h4>
                            <p className="m-0 mb-2.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                              입력하신 장소의 지역을 기준으로 AI가 골랐어요.
                            </p>
                            <div className="-mx-0.5 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                              {slide.aroundDisplay.map((ar) => (
                                <div
                                  key={ar.id}
                                  className="w-[132px] shrink-0 overflow-hidden rounded-xl border border-white/80 bg-white shadow-sm dark:border-zinc-600 dark:bg-zinc-900/60"
                                >
                                  <div className="relative aspect-[4/3] bg-zinc-200 dark:bg-zinc-800">
                                    {ar.image ? (
                                      <img src={ar.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                        <span className="material-symbols-outlined text-2xl">storefront</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="px-2 py-1.5">
                                    <p className="m-0 truncate text-[11px] font-bold text-gray-900 dark:text-gray-50">{ar.name}</p>
                                    {ar.desc ? (
                                      <p className="m-0 mt-0.5 line-clamp-2 text-[10px] leading-snug text-gray-500 dark:text-gray-400">
                                        {ar.desc}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFeaturedClick(slide)}
                      className="mt-2 w-full rounded-xl py-2 text-[13px] font-semibold text-primary hover:bg-primary/5"
                    >
                      이 매거진 상세 보기
                    </button>
                  </>
                )}

                {/* 6. 이 장소 실시간 사진 */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="m-0 text-[15px] font-bold text-gray-900 dark:text-gray-50">실시간으로 올라오는 사진</h3>
                    <button
                      type="button"
                      onClick={() => navigate('/main')}
                      className="m-0 cursor-pointer border-0 bg-transparent p-0 text-xs font-medium text-primary/90 hover:underline"
                    >
                      전체보기
                    </button>
                  </div>
                  {regionPosts.length === 0 ? (
                    <p className="m-0 py-3 text-[12px] text-gray-500">이 장소와 맞는 사진이 아직 없어요.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {regionPosts.map((post) => {
                        const uri = getMapThumbnailUri(post);
                        const label = getTimeAgo(post.timestamp || post.createdAt);
                        const loc =
                          normalizeSpace(post.detailedLocation || post.placeName || post.location || '') ||
                          '여행 기록';
                        return (
                          <button
                            key={post.id}
                            type="button"
                            onClick={() => navigate(`/post/${post.id}`)}
                            className="w-full overflow-hidden rounded-xl border border-zinc-100 bg-white text-left shadow-sm transition-shadow hover:shadow dark:border-zinc-800 dark:bg-gray-900"
                          >
                            <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
                              {uri ? (
                                <img src={uri} alt="" className="h-full w-full object-cover" loading="lazy" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                  <span className="material-symbols-outlined text-3xl">image</span>
                                </div>
                              )}
                              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-start">
                                <span className="inline-flex max-w-full truncate rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary backdrop-blur-sm dark:bg-primary/25 dark:text-primary">
                                  {label}
                                </span>
                              </div>
                            </div>
                            <div className="px-1.5 py-1.5">
                              <p className="m-0 truncate text-[12px] font-bold text-gray-900 dark:text-gray-50">{loc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {slides.length > 1 && (
        <div className="mt-3 flex flex-col items-center gap-1 px-2 pb-1" aria-live="polite">
          <span className="sr-only">
            장소 {slides.length}곳, 현재 {placeSlideIdx + 1}번째
          </span>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="장소 슬라이드">
            {slides.map((_, i) => (
              <button
                key={`place-idx-${i}`}
                type="button"
                role="tab"
                aria-selected={i === placeSlideIdx}
                aria-label={`장소 ${i + 1} / ${slides.length}`}
                className={`carousel-page-dot inline-flex min-h-0 min-w-0 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 p-0 leading-none transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 ${
                  i === placeSlideIdx
                    ? 'h-1.5 w-5 bg-zinc-800 dark:bg-zinc-100'
                    : 'h-1.5 w-1.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  scrollToPlaceSlide(i);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MagazinePublishedCarousel;
