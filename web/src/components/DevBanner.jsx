import React from 'react'

/**
 * 개발용 배너 컴포넌트
 * 웹 앱이 개발 확인용임을 명시하는 배너
 */
const DevBanner = () => {
  return (
    <div className="dev-banner">
      <div className="dev-banner-content">
        <span className="dev-banner-icon">🔧</span>
        <span className="dev-banner-text">
          개발 확인용 화면 - 실제 서비스는 모바일 앱을 이용해주세요
        </span>
      </div>
    </div>
  )
}

export default DevBanner









































