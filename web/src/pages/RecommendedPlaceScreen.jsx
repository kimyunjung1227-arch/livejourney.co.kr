import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getRecommendedRegions, RECOMMENDATION_TYPES } from '../utils/recommendationEngine';
import { getCombinedPosts } from '../utils/mockData';
import { getDisplayImageUrl } from '../api/upload';
import './MainScreen.css';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1548115184-bc65ae4986cf?w=800&q=80';

const RecommendedPlaceScreen = () => {
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState('blooming');
  const [recommendedData, setRecommendedData] = useState([]);
  const [allPosts, setAllPosts] = useState([]);

  const loadData = useCallback(() => {
    const localPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const combined = getCombinedPosts(Array.isArray(localPosts) ? localPosts : []);
    setAllPosts(combined);
    const recs = getRecommendedRegions(combined, selectedTag);
    setRecommendedData(recs);
  }, [selectedTag]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="screen-layout" style={{ background: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <header className="screen-header" style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        background: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0
      }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '12px', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: '#333' }}>arrow_back</span>
        </button>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1f2937' }}>추천 여행지</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
            {RECOMMENDATION_TYPES.find(t => t.id === selectedTag)?.description}
          </p>
        </div>
      </header>

      {/* 필터 탭 */}
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }} className="hide-scrollbar">
          {RECOMMENDATION_TYPES.map(tag => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              style={{
                background: selectedTag === tag.id ? '#00BCD4' : '#f1f5f9',
                color: selectedTag === tag.id ? 'white' : '#64748b',
                padding: '10px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="screen-content" style={{ flex: 1, overflow: 'auto', padding: '16px', paddingBottom: '100px' }}>
        {recommendedData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>explore</span>
            <p>아직 추천 여행지가 없어요</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>사진을 올려보세요!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {recommendedData.map((item, idx) => {
              const regionPosts = allPosts.filter(p =>
                (typeof p.location === 'string' && p.location.includes(item.regionName)) ||
                (p.detailedLocation && String(p.detailedLocation).includes(item.regionName)) ||
                (p.placeName && String(p.placeName).includes(item.regionName))
              );
              const rawImages = [
                item.image,
                ...regionPosts.flatMap(p => (p.images && p.images.length ? p.images : [p.thumbnail || p.image].filter(Boolean)))
              ].filter(Boolean);
              const mainImageUrl = getDisplayImageUrl(rawImages[0]) || PLACEHOLDER_IMAGE;

              return (
                <div
                  key={idx}
                  onClick={() => navigate(`/region/${item.regionName}`)}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <div style={{ width: '100%', aspectRatio: '1', background: '#eee', position: 'relative' }}>
                    <img
                      src={mainImageUrl}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE; }}
                    />
                  </div>
                  <div style={{ padding: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default RecommendedPlaceScreen;
