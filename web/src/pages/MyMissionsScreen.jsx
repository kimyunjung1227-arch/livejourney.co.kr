import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { addNotification } from '../utils/notifications';
import { awardBadge, BADGES } from '../utils/badgeSystem';
import { getSOSMissions, updateMissionResponseStatus } from '../utils/sosMissionStore';

const MISSION_REWARD_KEY = 'missionReward_v1';

const MyMissionsScreen = () => {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const missions = useMemo(
    () => getSOSMissions().filter((m) => m?.requesterId === 'current-user'),
    [tick]
  );

  useEffect(() => {
    const onUpdate = () => setTick((v) => v + 1);
    window.addEventListener('sosMissionUpdated', onUpdate);
    return () => window.removeEventListener('sosMissionUpdated', onUpdate);
  }, []);

  const handleDecision = (mission, response, decision) => {
    updateMissionResponseStatus(mission.id, response.id, decision);
    const rewardRaw = JSON.parse(localStorage.getItem(MISSION_REWARD_KEY) || '{}');
    const prev = rewardRaw[response.responderId] || { accepted: 0, rejected: 0, trustBonus: 0 };
    if (decision === 'accepted') {
      rewardRaw[response.responderId] = {
        ...prev,
        accepted: (prev.accepted || 0) + 1,
        trustBonus: (prev.trustBonus || 0) + 120
      };
      addNotification({
        type: 'system',
        title: '🎯 미션 정보가 채택되었어요',
        message: '정보 제공자에게 신뢰지수/뱃지 혜택이 반영되었습니다.',
        link: '/profile'
      });
      if (BADGES?.['실시간 답변러']) awardBadge(BADGES['실시간 답변러']);
    } else {
      rewardRaw[response.responderId] = { ...prev, rejected: (prev.rejected || 0) + 1 };
    }
    localStorage.setItem(MISSION_REWARD_KEY, JSON.stringify(rewardRaw));
    setTick((v) => v + 1);
  };

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark h-[100dvh] overflow-hidden flex flex-col">
      <div className="screen-content flex flex-col flex-1 min-h-0 overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border-light bg-white dark:border-border-dark dark:bg-gray-900 px-4">
          <button onClick={() => navigate('/map')} className="flex size-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-base font-bold">내가 올린 미션</h1>
          <div className="w-10" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 space-y-3">
          {missions.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-10">등록된 내 미션이 없습니다.</p>
          )}
          {missions.map((mission) => {
            const responses = Array.isArray(mission.responses) ? mission.responses : [];
            return (
              <div key={mission.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
                <p className="text-sm font-semibold">{mission.locationName || '근처 지역'}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{mission.question}</p>
                <div className="mt-2 space-y-2">
                  {responses.length === 0 && <p className="text-xs text-gray-500">아직 올라온 응답이 없습니다.</p>}
                  {responses.map((resp) => (
                    <div key={resp.id} className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2">
                      <p className="text-xs text-gray-600 dark:text-gray-300">{resp.note}</p>
                      {!!resp.photoUrl && (
                        <a href={resp.photoUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-600">
                          사진 보기
                        </a>
                      )}
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecision(mission, resp, 'accepted')}
                          className="rounded-md bg-emerald-600 text-white px-2 py-1 text-xs"
                        >
                          가장 도움이 되었어요
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision(mission, resp, 'rejected')}
                          className="rounded-md bg-rose-600 text-white px-2 py-1 text-xs"
                        >
                          정보 거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default MyMissionsScreen;
