import React from 'react';

/**
 * 매거진 장소별 — 현장 사용자가 올린 사진·짧은 글
 * @param {{ id: string, text: string, author: string, timeLabel: string, thumbUrl?: string }[]} voices
 */
const MagazineFieldVoices = ({ voices = [], className = '' }) => {
  const list = Array.isArray(voices) ? voices.filter((v) => v && String(v.text || '').trim()) : [];
  if (list.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/95 to-orange-50/40 p-3 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-orange-950/20 ${className}`}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className="material-symbols-outlined text-[18px] text-amber-700 dark:text-amber-400"
          style={{ fontVariationSettings: '"FILL" 0' }}
          aria-hidden
        >
          photo_camera
        </span>
        <h4 className="m-0 text-[13px] font-extrabold tracking-tight text-amber-950 dark:text-amber-100">
          지금 현장에서 올라온 기록
        </h4>
        <span className="ml-auto rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
          사진·글
        </span>
      </div>
      <p className="m-0 mb-2.5 text-[11px] leading-snug text-amber-900/75 dark:text-amber-200/85">
        이 장소에 사진을 남긴 여행자들의 짧은 메모예요.
      </p>
      <div
        className="-mx-0.5 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="현장 기록"
      >
        {list.map((v) => (
          <blockquote
            key={v.id}
            role="listitem"
            className="w-[min(100%,300px)] shrink-0 overflow-hidden rounded-lg border border-white/80 bg-white/90 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/70"
          >
            {v.thumbUrl ? (
              <div className="aspect-[16/10] w-full bg-zinc-200 dark:bg-zinc-800">
                <img src={v.thumbUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ) : null}
            <div className="px-3 py-2.5">
              <p className="m-0 text-[13px] font-medium leading-snug text-gray-800 dark:text-gray-100 line-clamp-4">
                “{v.text}”
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-zinc-100 pt-1.5 dark:border-zinc-700/80">
                <span className="min-w-0 truncate text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                  {v.author}
                </span>
                {v.timeLabel ? (
                  <span className="shrink-0 text-[10px] font-medium text-gray-400 dark:text-gray-500">{v.timeLabel}</span>
                ) : null}
              </div>
            </div>
          </blockquote>
        ))}
      </div>
    </div>
  );
};

export default MagazineFieldVoices;
