import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { publishMagazine } from '../utils/magazinesStore';
import { useAuth } from '../contexts/AuthContext';
import { useAdminState } from '../utils/admin';

const DRAFT_KEY = 'magazinePublishDraft';

const MagazineWriteScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminState(user);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d?.title) setTitle(String(d.title));
      if (d?.content) setContent(String(d.content));
    } catch (_) {
      // ignore
    }
  }, []);

  const canSubmit = useMemo(() => !!title.trim() && !!content.trim(), [title, content]);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, savedAt: Date.now() }));
      alert('임시저장되었습니다.');
    } catch (_) {
      alert('임시저장에 실패했습니다.');
    }
  }, [title, content]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!title.trim()) {
        alert('제목을 입력해 주세요.');
        return;
      }
      if (!content.trim()) {
        alert('내용을 입력해 주세요.');
        return;
      }

      setSaving(true);
      const res = await publishMagazine({
        title: title.trim(),
        subtitle: content.trim(),
        sections: [
          {
            location: title.trim(),
            description: content.trim(),
            around: [],
          },
        ],
      });
      setSaving(false);

      if (!res.success) {
        alert('매거진 발행에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (_) {}
      navigate(`/magazine/${res.magazine.id}`, { replace: true, state: { magazine: res.magazine } });
    },
    [title, content, navigate]
  );

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark h-screen overflow-hidden">
      <div className="screen-content flex flex-col h-full">
        {/* 헤더 */}
        <header className="screen-header flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
          <button
            type="button"
            onClick={saveDraft}
            className="text-[14px] font-semibold text-gray-700 dark:text-gray-200 px-2 py-2"
          >
            임시저장
          </button>
          <button
            type="submit"
            form="magazine-publish-form"
            disabled={!canSubmit || saving}
            className={`text-[14px] font-extrabold px-2 py-2 ${
              !canSubmit || saving ? 'text-gray-300 dark:text-gray-600' : 'text-[#22c55e]'
            }`}
          >
            등록
          </button>
        </header>

        {/* 폼 */}
        <main className="flex-1 overflow-y-auto px-4 pt-3 pb-20">
          {adminLoading ? (
            <div className="py-12 text-center text-[13px] text-gray-500">권한 확인 중...</div>
          ) : !isAdmin ? (
            <div className="py-12 text-center text-[13px] text-gray-500 dark:text-gray-400">
              <p className="mb-2 font-semibold text-gray-800 dark:text-gray-100">매거진 발행은 관리자 승인 계정만 가능합니다.</p>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center rounded-full bg-gray-900 text-white px-4 py-2 text-[13px] font-semibold"
              >
                돌아가기
              </button>
            </div>
          ) : (
          <form id="magazine-publish-form" className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-2 text-[13px] font-semibold text-gray-800 dark:text-gray-100">제목</label>
              <input
                className="w-full border-b border-zinc-200 dark:border-zinc-700 bg-transparent px-0 py-3 text-[16px] font-semibold text-gray-900 dark:text-gray-50 focus:outline-none"
                placeholder="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-[13px] font-semibold text-gray-800 dark:text-gray-100">내용</label>
              <textarea
                className="w-full min-h-[240px] bg-transparent px-0 py-2 text-[15px] leading-relaxed text-gray-900 dark:text-gray-50 focus:outline-none resize-none"
                placeholder="내용을 입력하세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </form>
          )}
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MagazineWriteScreen;

