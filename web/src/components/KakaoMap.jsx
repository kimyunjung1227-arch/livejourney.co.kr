import React, { useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';

const KakaoMap = ({ 
  center = { lat: 37.5665, lng: 126.9780 }, // 서울 시청 기본값
  level = 8, // 확대 레벨 (1-14, 숫자가 클수록 넓은 범위)
  markers = [], // 마커 배열 [{ lat, lng, title, content }]
  onMarkerClick = () => {},
  style = { width: '100%', height: '100%' }
}) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Kakao Map 초기화
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      logger.error('Kakao Maps SDK가 로드되지 않았습니다.');
      return;
    }

    // 지도 생성
    const options = {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: level
    };

    const map = new window.kakao.maps.Map(mapContainer.current, options);
    mapInstance.current = map;
    setIsMapLoaded(true);

    // 지도 타입 컨트롤 추가
    const mapTypeControl = new window.kakao.maps.MapTypeControl();
    map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

    // 줌 컨트롤 추가
    const zoomControl = new window.kakao.maps.ZoomControl();
    map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

  }, []);

  // 중심점 변경
  useEffect(() => {
    if (mapInstance.current && window.kakao) {
      const moveLatLon = new window.kakao.maps.LatLng(center.lat, center.lng);
      mapInstance.current.setCenter(moveLatLon);
    }
  }, [center]);

  // 마커 업데이트
  useEffect(() => {
    if (!mapInstance.current || !isMapLoaded) return;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 새 마커 추가
    markers.forEach((markerData, index) => {
      const markerPosition = new window.kakao.maps.LatLng(markerData.lat, markerData.lng);
      
      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        title: markerData.title || '',
        clickable: true
      });

      marker.setMap(mapInstance.current);
      markersRef.current.push(marker);

      // 인포윈도우 생성 (클릭 시 표시)
      if (markerData.content) {
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:10px;min-width:150px;text-align:center;">
            <strong>${markerData.title || '장소'}</strong><br/>
            ${markerData.content || ''}
          </div>`
        });

        // 마커 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', function() {
          infowindow.open(mapInstance.current, marker);
          onMarkerClick(markerData, index);
        });
      }
    });
  }, [markers, isMapLoaded, onMarkerClick]);

  return (
    <div 
      ref={mapContainer} 
      style={style}
      className="rounded-xl overflow-hidden"
    />
  );
};

export default KakaoMap;

