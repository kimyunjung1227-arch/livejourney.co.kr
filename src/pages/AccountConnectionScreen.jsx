import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';

const AccountConnectionScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // 소셜 계정 연결 상태 (더미 데이터)
  const [accounts, setAccounts] = useState({
    kakao: true,
    google: false,
    apple: false,
    naver: false
  });

  // 현재 로그인 방식 (더미)
  const currentLoginMethod = 'KakaoTalk';

  const socialAccounts = [
    {
      id: 'kakao',
      name: '카카오톡',
      icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApVSEMHUIXRCI1f2AvptQYINL5s8BBNI6Hd-u4iaYnsiUzSXxmboJeNBaYJCqCOwfYgsiUyqZwldpyTr4AdwE-nYtP8pVJeOFoLOAUsc5lyG8qRUXogBBghP5z_HgmvaJMAuSaAyAE1pIwPFQZ2gwXaMyrKaOujuW7FHMKxE92_yFjFz_NTCupDe11RiNjXHe1sgFmN8Lie_t5iPzq5xagzwiFvIxhsVYq8glIHXj2EBaDyU8YXFtgeGKt5w8wugZc8O0I4Nnh6qV1'
    },
    {
      id: 'google',
      name: 'Google',
      icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCs3S0Pv-1y7pJ_6Kaya2ETt0k1yfBDYcsweG_YHfX1wh2pjVYZ8vb9dlJkXDla6lqjP351lkyJJLkcO_zi2ElXb9qi1HaRIM0bVfDNgvh7corPshJp_XahOCzkvrzyZavsXQjMGxB6h3DZa9IeTOeDMnUY1x_g7aauaCKpQHlHFvvoiXBOmpcororhq4vjcgSsVXqMOJchZq6D3PtJ55lJPkOFcd9F07C0JHqWDoSovLSi1m7r11hPep1-SxbeGhrsmIYam0bjGL5n'
    },
    {
      id: 'apple',
      name: 'Apple ID',
      icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAc9Z9BS0PGRYnCeivN5IaVbIL7a2A3dbyq6yDyxuXzjwqbcL8wmcwyvWznYgrOV_NeF-d-xJmc1nkRcZn7i7fEc081AKL8ryW4zSsmxjrP6iFglgs-s-E_nT2GbZ9o7fXNyJvtG37lYXL6TcUcFTBtc4SRNzSgL-5aYNfSuUGQFOetOwGKEFqtiPVzngGxr88NzgUvQT-e4OYHI73h4fkvEwwY4aQRa1LwjdFHj5Gsj8cJDEaK0AOZMHnwfcKelLZsoN0A83adjx2M',
      darkInvert: true
    },
    {
      id: 'naver',
      name: '네이버',
      icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADq35sfvWsGXxnoN-KqkanTEentsRZCWd7ugdEx7bvKIZIthOPBHayjYFnJCeK-uSecZt1NPetCE-2x0HyxO35rIgjL2DurmLnWCpHOE9qT7T1DF1hIvDVqq4frIxMnZiV7HEcKw7lI1e5YKJF_QaK_cgU6-qJYS38DVWArDawo5XY4RDHl9Y-ZAXVyplV4cGraQiFd9FwznGbCH7f8T_xtg9pQ_VPeRHgfu49exX7GgjPy1rRo-WmNJC24M7FsdMe7Tz_SAN0bbWo'
    }
  ];

  const handleDisconnect = (accountId, accountName) => {
    setSelectedAccount({ id: accountId, name: accountName });
    setShowDisconnectModal(true);
  };

  const confirmDisconnect = () => {
    // TODO: API 호출하여 계정 연결 해제
    setAccounts(prev => ({
      ...prev,
      [selectedAccount.id]: false
    }));
    alert(`${selectedAccount.name} 계정 연결이 해제되었습니다.`);
    setShowDisconnectModal(false);
    setSelectedAccount(null);
  };

  const cancelDisconnect = () => {
    setShowDisconnectModal(false);
    setSelectedAccount(null);
  };

  const handleConnect = (accountId, accountName) => {
    // TODO: API 호출하여 계정 연결
    alert(`${accountName} 계정 연결 기능은 추후 구현 예정입니다.\n\n${accountName} 로그인 페이지로 이동합니다.`);
    // 연결 성공 시
    // setAccounts(prev => ({
    //   ...prev,
    //   [accountId]: true
    // }));
  };

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-light bg-surface-light/80 dark:border-border-dark dark:bg-surface-dark/80 backdrop-blur-sm px-4">
        <button 
          onClick={() => navigate('/settings')}
          className="flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-2xl text-content-light dark:text-content-dark">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">
          계정 연결 관리
        </h1>
        <div className="flex size-12 shrink-0 items-center justify-end"></div>
      </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-grow pb-4">
        <div className="flex flex-col">
          {/* 현재 로그인 방식 */}
          <div className="px-4 pt-6 pb-2">
            <h2 className="text-sm font-medium leading-normal text-subtle-light dark:text-subtle-dark">
              현재 로그인 방식
            </h2>
            <p className="mt-1 text-xs text-subtle-light dark:text-subtle-dark">
              현재 로그인된 계정 정보입니다.
            </p>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark">
            <div className="flex h-14 items-center justify-between px-4">
              <p className="text-base font-normal leading-normal text-content-light dark:text-content-dark">
                현재 로그인 방식
              </p>
              <p className="text-base font-normal leading-normal text-subtle-light dark:text-subtle-dark">
                {currentLoginMethod}
              </p>
            </div>
          </div>

          {/* 소셜 계정 연결 관리 */}
          <div className="px-4 pt-6 pb-2">
            <h2 className="text-sm font-medium leading-normal text-subtle-light dark:text-subtle-dark">
              소셜 계정 연결 관리
            </h2>
            <p className="mt-1 text-xs text-subtle-light dark:text-subtle-dark">
              연결된 소셜 계정을 관리할 수 있습니다.
            </p>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark">
            <div className="flex flex-col">
              {socialAccounts.map((account, index) => (
                <div 
                  key={account.id}
                  className={`flex h-16 items-center justify-between px-4 ${
                    index < socialAccounts.length - 1 ? 'border-b border-border-light dark:border-border-dark' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      alt={`${account.name} icon`}
                      className={`h-6 w-6 ${account.darkInvert ? 'dark:invert' : ''}`}
                      src={account.icon}
                    />
                    <span className="text-base font-normal leading-normal text-content-light dark:text-content-dark">
                      {account.name}
                    </span>
                  </div>
                  {accounts[account.id] ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary">연결됨</span>
                      <button 
                        onClick={() => handleDisconnect(account.id, account.name)}
                        className="h-8 rounded-lg border border-border-light dark:border-border-dark bg-surface-subtle-light dark:bg-surface-subtle-dark px-3 text-sm font-medium text-content-light dark:text-content-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        해제
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleConnect(account.id, account.name)}
                      className="h-8 rounded-lg border border-primary bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      연결
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        </main>
      </div>

      <BottomNavigation />

      {/* 연결 해제 확인 모달 */}
      {showDisconnectModal && selectedAccount && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface-light dark:bg-surface-dark p-6 text-center shadow-2xl">
            <h3 className="text-lg font-bold text-content-light dark:text-content-dark">
              {selectedAccount.name} 연결 해제
            </h3>
            <p className="mt-2 text-sm text-subtle-light dark:text-subtle-dark">
              정말로 {selectedAccount.name} 계정 연결을 해제하시겠습니까?
            </p>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={cancelDisconnect}
                className="h-12 w-full rounded-lg bg-surface-subtle-light dark:bg-surface-subtle-dark text-base font-bold text-content-light dark:text-content-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={confirmDisconnect}
                className="h-12 w-full rounded-lg bg-danger text-base font-bold text-white hover:bg-red-600 transition-colors"
              >
                해제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountConnectionScreen;



