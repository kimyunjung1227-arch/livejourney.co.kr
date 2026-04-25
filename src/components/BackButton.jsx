import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 공통 뒤로가기 버튼
 * - SearchScreen 스타일 기준
 * - onClick 미지정 시 history -1
 */
const BackButton = ({ onClick, ariaLabel = '뒤로 가기' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className="flex size-12 shrink-0 items-center justify-center text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
    >
      <span className="material-symbols-outlined text-2xl">arrow_back</span>
    </button>
  );
};

export default BackButton;

