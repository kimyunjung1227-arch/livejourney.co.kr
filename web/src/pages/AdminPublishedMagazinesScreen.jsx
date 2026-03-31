import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPublishedMagazines, removePublishedMagazine } from '../utils/magazinesStore';

const AdminPublishedMagazinesScreen = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const mags = await listPublishedMagazines();
      setItems(Array.isArray(mags) ? mags : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (d) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const handleDelete = async (id) => {
    if (!id) return;
    const res = await removePublishedMagazine(id);
    if (!res.success) {
      alert('삭제에 실패했습니다.');
      return;
    }
    setDeleteId(null);
    await load();
    alert('삭제되었습니다.');
  };

  return (
    <div className="screen-layout bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="뒤로가기"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">발행 매거진 관리</h1>
        <div className="w-10" />
      </header>

      <main className="p-4 pb-24">
        {loading ? (
          <div className="py-8 text-center text-gray-500">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-500">발행된 매거진이 없습니다.</div>
        ) : (
          <ul className="space-y-3">
            {items.map((m) => (
              <li
                key={m.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-extrabold text-gray-900 dark:text-gray-50 truncate">{m.title || '(제목 없음)'}</div>
                    {m.subtitle ? (
                      <div className="mt-1 text-[12px] text-gray-600 dark:text-gray-300 line-clamp-2">{m.subtitle}</div>
                    ) : null}
                    <div className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                      {m.author || 'LiveJourney'} · {formatDate(m.createdAt || m.created_at)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/magazine/${m.id}`, { state: { magazine: m } })}
                      className="rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-[12px] font-semibold text-gray-800 dark:text-gray-100"
                    >
                      미리보기
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(m.id)}
                      className="rounded-full bg-rose-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {deleteId && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-[320px] rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-xl">
              <h3 className="text-[16px] font-extrabold text-gray-900 dark:text-gray-50 m-0">매거진 삭제</h3>
              <p className="mt-2 text-[13px] text-gray-600 dark:text-gray-300">
                이 매거진을 삭제할까요? 삭제하면 복구할 수 없습니다.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="flex-1 rounded-full bg-gray-100 dark:bg-gray-800 py-2.5 text-[13px] font-semibold text-gray-700 dark:text-gray-100"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 rounded-full bg-rose-600 py-2.5 text-[13px] font-semibold text-white"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPublishedMagazinesScreen;

