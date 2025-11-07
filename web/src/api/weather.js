// 날씨 API 연동
import api from './axios';
import { getCoordinatesByRegion } from '../utils/regionCoordinates';

// 날씨 캐시 (5분간 유효)
const weatherCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * 지역별 날씨 정보 가져오기 (캐시 + 타임아웃 적용)
 * @param {string} regionName - 지역명 (예: '서울', '부산')
 * @returns {Promise<Object>} 날씨 정보
 */
export const getWeatherByRegion = async (regionName) => {
  const KMA_API_KEY = import.meta.env.VITE_KMA_API_KEY;
  
  // Mock 데이터 정의 (즉시 표시용)
  const mockWeatherData = {
    '서울': { icon: '☀️', condition: '맑음', temperature: '23℃' },
    '부산': { icon: '🌤️', condition: '구름조금', temperature: '25℃' },
    '제주': { icon: '🌧️', condition: '비', temperature: '20℃' },
    '인천': { icon: '☁️', condition: '흐림', temperature: '22℃' },
    '대전': { icon: '☀️', condition: '맑음', temperature: '24℃' },
    '대구': { icon: '☀️', condition: '맑음', temperature: '26℃' },
    '광주': { icon: '🌤️', condition: '구름조금', temperature: '24℃' },
    '울산': { icon: '🌤️', condition: '구름조금', temperature: '25℃' },
    '강릉': { icon: '☀️', condition: '맑음', temperature: '21℃' },
    '경주': { icon: '☀️', condition: '맑음', temperature: '24℃' }
  };
  
  // 캐시 확인 - 있으면 즉시 반환!
  const cached = weatherCache.get(regionName);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`⚡ 캐시된 날씨 정보 즉시 반환: ${regionName}`);
    return cached.data;
  }
  
  // 1. 먼저 Mock 데이터를 즉시 반환 (기다리지 않음!)
  const mockWeather = mockWeatherData[regionName] || mockWeatherData['서울'];
  const mockResult = {
    success: true,
    weather: {
      ...mockWeather,
      humidity: '60%',
      wind: '5m/s'
    }
  };
  
  // API 키가 없으면 Mock 데이터만 사용
  if (!KMA_API_KEY) {
    console.log(`📦 Mock 데이터 즉시 반환: ${regionName}`);
    weatherCache.set(regionName, {
      data: mockResult,
      timestamp: Date.now()
    });
    return mockResult;
  }
  
  // 2. 백그라운드에서 실제 API 호출 (비동기)
  const fetchRealWeather = async () => {
    try {
      // 지역 좌표 가져오기
      const coords = getCoordinatesByRegion(regionName);
      
      // 현재 날짜와 시간 (기상청 API 형식)
      const now = new Date();
      const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
      const hours = now.getHours().toString().padStart(2, '0');
      const baseTime = hours + '00';
      
      console.log(`🔍 백그라운드 기상청 API 호출: ${regionName} (${coords.nx}, ${coords.ny})`);
      
      // 기상청 초단기실황 API 호출 (타임아웃 2초로 단축)
      const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst`;
      const params = new URLSearchParams({
        serviceKey: KMA_API_KEY,
        pageNo: '1',
        numOfRows: '10',
        dataType: 'JSON',
        base_date: baseDate,
        base_time: baseTime,
        nx: coords.nx.toString(),
        ny: coords.ny.toString()
      });
      
      // 타임아웃 설정 (2초로 단축)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${url}?${params}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const data = await response.json();
    
    // API 응답 확인
    if (data.response?.header?.resultCode === '00' && data.response?.body?.items?.item) {
      const items = data.response.body.items.item;
      
      // 기온(T1H)과 하늘상태(PTY) 찾기
      let temperature = '23';
      let sky = '맑음';
      let icon = '☀️';
      
      items.forEach(item => {
        if (item.category === 'T1H') {
          temperature = Math.round(item.obsrValue);
        }
        if (item.category === 'PTY') {
          // 0: 없음, 1: 비, 2: 비/눈, 3: 눈, 4: 소나기
          const ptyValue = parseInt(item.obsrValue);
          if (ptyValue === 1 || ptyValue === 4) {
            sky = '비';
            icon = '🌧️';
          } else if (ptyValue === 2) {
            sky = '진눈깨비';
            icon = '🌨️';
          } else if (ptyValue === 3) {
            sky = '눈';
            icon = '❄️';
          }
        }
      });
      
      const result = {
        success: true,
        weather: {
          icon,
          condition: sky,
          temperature: `${temperature}℃`,
          humidity: '60%',
          wind: '5m/s'
        }
      };
      
      // 캐시에 저장
      weatherCache.set(regionName, {
        data: result,
        timestamp: Date.now()
      });
      
      console.log(`✅ 백그라운드 기상청 API 성공: ${regionName} - ${sky}, ${temperature}℃`);
      return result;
    }
    
    throw new Error('기상청 API 응답 실패');
    
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`⏱️ 기상청 API 타임아웃 (2초 초과): ${regionName}`);
      } else {
        console.error(`❌ 기상청 API 오류: ${regionName}`, error.message);
      }
      return null;
    }
  };
  
  // 백그라운드에서 실제 API 호출 시작 (비동기, 기다리지 않음!)
  fetchRealWeather().then(realData => {
    if (realData) {
      // 실제 데이터를 캐시에 저장
      weatherCache.set(regionName, {
        data: realData,
        timestamp: Date.now()
      });
      console.log(`🔄 실시간 날씨 데이터 캐시 업데이트: ${regionName}`);
    }
  });
  
  // 3. 즉시 Mock 데이터 반환 (기다리지 않음!)
  console.log(`⚡ Mock 데이터 즉시 반환: ${regionName} (백그라운드에서 실제 데이터 로딩 중...)`);
  
  // Mock 데이터 임시 캐시 (짧은 시간)
  weatherCache.set(regionName, {
    data: mockResult,
    timestamp: Date.now() - (CACHE_DURATION - 30000) // 30초만 유지
  });
  
  return mockResult;
};

/**
 * 날씨 아이콘 가져오기
 * @param {string} condition - 날씨 상태 (맑음, 흐림, 비, 눈 등)
 * @returns {string} 이모지 아이콘
 */
export const getWeatherIcon = (condition) => {
  const iconMap = {
    '맑음': '☀️',
    '구름조금': '🌤️',
    '흐림': '☁️',
    '비': '🌧️',
    '눈': '❄️',
    '천둥번개': '⛈️',
    '안개': '🌫️'
  };
  
  return iconMap[condition] || '🌤️';
};

/**
 * 교통 정보 가져오기 (실제 API + Fallback)
 * @param {string} regionName - 지역명
 * @returns {Promise<Object>} 교통 정보
 */
export const getTrafficByRegion = async (regionName) => {
  const SEOUL_TRAFFIC_KEY = import.meta.env.VITE_SEOUL_TRAFFIC_API_KEY;
  const NATIONAL_TRAFFIC_KEY = import.meta.env.VITE_NATIONAL_TRAFFIC_API_KEY;
  
  try {
    // 서울 지역 - TOPIS API 사용
    if (regionName.includes('서울') && SEOUL_TRAFFIC_KEY) {
      try {
        const url = `http://openapi.seoul.go.kr:8088/${SEOUL_TRAFFIC_KEY}/json/TrafficInfo/1/10/`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.TrafficInfo?.row) {
          // 평균 혼잡도 계산
          const avgSpeed = data.TrafficInfo.row.reduce((sum, item) => 
            sum + parseFloat(item.PRCS_SPD || 30), 0
          ) / data.TrafficInfo.row.length;
          
          let icon, status, congestionLevel;
          
          if (avgSpeed >= 40) {
            icon = '🚗';
            status = '교통 원활';
            congestionLevel = 'low';
          } else if (avgSpeed >= 20) {
            icon = '🚙';
            status = '교통 보통';
            congestionLevel = 'medium';
          } else {
            icon = '🚨';
            status = '교통 혼잡';
            congestionLevel = 'high';
          }
          
          return {
            success: true,
            traffic: { icon, status, congestionLevel, isRealTime: true }
          };
        }
      } catch (error) {
        console.error('서울시 교통 API 오류:', error);
      }
    }
    
    // 전국 - 국가교통정보센터 API 사용
    if (NATIONAL_TRAFFIC_KEY) {
      try {
        // TODO: 국가교통정보센터 API 연동
        // 실제 API 엔드포인트와 파라미터는 승인 후 확인
        console.log(`국가교통정보센터 API 호출: ${regionName}`);
      } catch (error) {
        console.error('국가교통정보센터 API 오류:', error);
      }
    }
    
    // Fallback: 시간대 기반 스마트 추정
    return getSmartTrafficEstimate(regionName);
    
  } catch (error) {
    console.error('교통 정보 조회 실패:', error);
    return getSmartTrafficEstimate(regionName);
  }
};

/**
 * 시간대 기반 스마트 교통 추정 (Fallback)
 * @param {string} regionName - 지역명
 * @returns {Object} 추정 교통 정보
 */
const getSmartTrafficEstimate = (regionName) => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  
  const majorCities = ['서울', '부산', '대구', '인천', '대전', '광주'];
  const isMajorCity = majorCities.some(city => regionName.includes(city) || city.includes(regionName));
  
  let congestionLevel = 'low';
  let status = '교통 원활';
  let icon = '🚗';
  
  if (isMajorCity) {
    if (!isWeekend) {
      if ((hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 20)) {
        congestionLevel = 'high';
        status = '교통 혼잡';
        icon = '🚨';
      } else if ((hour >= 12 && hour <= 14) || (hour >= 17 && hour <= 18)) {
        congestionLevel = 'medium';
        status = '교통 보통';
        icon = '🚙';
      }
    } else {
      if (hour >= 11 && hour <= 19) {
        congestionLevel = 'medium';
        status = '교통 보통';
        icon = '🚙';
      }
    }
  } else {
    const touristAreas = ['제주', '강릉', '속초', '경주', '여수'];
    if (touristAreas.some(area => regionName.includes(area)) && isWeekend && hour >= 10 && hour <= 17) {
      congestionLevel = 'medium';
      status = '교통 보통';
      icon = '🚙';
    }
  }
  
  return {
    success: true,
    traffic: {
      icon,
      status,
      congestionLevel,
      isEstimated: true
    }
  };
};

/**
 * 교통 아이콘 가져오기
 * @param {string} level - 혼잡도 (low, medium, high)
 * @returns {string} 이모지 아이콘
 */
export const getTrafficIcon = (level) => {
  const iconMap = {
    'low': '🚗',      // 원활
    'medium': '🚙',   // 보통
    'high': '🚨'      // 혼잡
  };
  
  return iconMap[level] || '🚗';
};

/**
 * 교통 상태 텍스트 가져오기
 * @param {string} level - 혼잡도
 * @returns {string} 상태 텍스트
 */
export const getTrafficStatus = (level) => {
  const statusMap = {
    'low': '교통 원활',
    'medium': '교통 보통',
    'high': '교통 혼잡'
  };
  
  return statusMap[level] || '정보 없음';
};












































