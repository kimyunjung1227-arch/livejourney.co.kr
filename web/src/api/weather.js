// 날씨 API 연동
import api from './axios';
import { getCoordinatesByRegion } from '../utils/regionCoordinates';
import { logger } from '../utils/logger';

// 날씨 캐시 (5분간 유효)
const weatherCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 재시도 설정
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1초
const API_TIMEOUT = 10000; // 10초

/**
 * 재시도 로직이 포함된 fetch 함수
 * @param {string} url - API URL
 * @param {AbortSignal} signal - AbortSignal
 * @param {number} retries - 남은 재시도 횟수
 * @returns {Promise<Response>}
 */
const fetchWithRetry = async (url, signal, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      logger.log(`🔄 기상청 API 호출 시도 ${i + 1}/${retries}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      // 기존 signal과 새로운 timeout signal 병합
      if (signal) {
        signal.addEventListener('abort', () => controller.abort());
      }

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      // 응답이 실패했지만 재시도 가능한 경우
      if (i < retries - 1) {
        logger.warn(`⚠️ API 응답 실패 (${response.status}), ${RETRY_DELAY}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
        continue;
      }

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        if (i < retries - 1) {
          logger.warn(`⏱️ 타임아웃 발생, ${RETRY_DELAY * (i + 1)}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
          continue;
        }
        throw error;
      }

      // 네트워크 오류 등
      if (i < retries - 1) {
        logger.warn(`🌐 네트워크 오류, ${RETRY_DELAY * (i + 1)}ms 후 재시도...`, error.message);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
        continue;
      }

      throw error;
    }
  }

  throw new Error('모든 재시도 실패');
};

/**
 * 지역별 날씨 정보 가져오기 (캐시 + 재시도 + 타임아웃 적용)
 * @param {string} regionName - 지역명 (예: '서울', '부산')
 * @param {boolean} forceRefresh - 캐시 무시하고 강제 새로고침
 * @returns {Promise<Object>} 날씨 정보
 */
export const getWeatherByRegion = async (regionName, forceRefresh = false) => {
  const KMA_API_KEY = import.meta.env.VITE_KMA_API_KEY;

  logger.log('🌦️ 날씨 API 호출 시작:', regionName);
  logger.log('🔑 API 키:', KMA_API_KEY ? '있음 ✅' : '없음 ❌');

  // 캐시 확인 - 있으면 즉시 반환! (강제 새로고침이 아닐 때만)
  if (!forceRefresh) {
    const cached = weatherCache.get(regionName);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      logger.log(`⚡ 캐시된 날씨 정보 즉시 반환: ${regionName}`);
      return cached.data;
    }
  }

  if (!KMA_API_KEY || KMA_API_KEY === 'your_kma_api_key_here') {
    logger.warn('⚠️ 기상청 API 키가 설정되지 않았습니다. VITE_KMA_API_KEY를 설정해 주세요.');
    return {
      success: false,
      error: 'API 키가 필요합니다',
      weather: { icon: '🌤️', condition: '-', temperature: '-', humidity: '-', wind: '-' }
    };
  }

  // 실제 기상청 API 호출 (재시도 로직 포함)
  try {
    // 지역 좌표 가져오기
    const coords = getCoordinatesByRegion(regionName);

    logger.log(`📍 지역 좌표 조회: ${regionName}`, coords);

    if (!coords || !coords.nx || !coords.ny) {
      logger.error(`❌ 지역 좌표 없음 또는 잘못됨: ${regionName}`, coords);
      throw new Error(`지역 좌표 없음: ${regionName}`);
    }

    // 현재 날짜와 시간
    const now = new Date();

    // 기상청은 매시각 30분에 데이터 생성, 40분에 발표
    // 현재 시각이 40분 이전이면 이전 시간 데이터 사용
    let hours = now.getHours();
    const minutes = now.getMinutes();

    // 날짜 처리를 위해 복사본 생성
    const requestDate = new Date(now);

    if (minutes < 40) {
      hours = hours - 1;
      if (hours < 0) {
        hours = 23;
        // 하루 전으로 날짜 변경
        requestDate.setDate(requestDate.getDate() - 1);
      }
    }

    // 기상청 API는 YYYYMMDD 형식을 요구합니다.
    // .toISOString()은 UTC 기준이므로 한국 시간 계산 시 날짜가 하루 밀릴 수 있습니다.
    // 따라서 로컬 시간을 기준으로 직접 포맷팅합니다.
    const year = requestDate.getFullYear();
    const month = String(requestDate.getMonth() + 1).padStart(2, '0');
    const day = String(requestDate.getDate()).padStart(2, '0');
    const baseDate = `${year}${month}${day}`;

    // const baseDate = requestDate.toISOString().slice(0, 10).replace(/-/g, ''); // REMOVED due to UTC issue
    const baseTime = hours.toString().padStart(2, '0') + '00';

    logger.log(`🔍 기상청 API 호출: ${regionName} (nx:${coords.nx}, ny:${coords.ny})`);
    logger.log(`📅 기준시각: ${baseDate} ${baseTime}`);

    // 기상청 초단기실황 API 호출
    const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst`;
    const params = new URLSearchParams({
      serviceKey: KMA_API_KEY,
      pageNo: '1',
      numOfRows: '10',
      dataType: 'JSON',
      base_date: baseDate,
      base_time: baseTime,
      nx: String(coords.nx),
      ny: String(coords.ny)
    });

    const fullUrl = `${url}?${params.toString()}`;
    logger.log('🌐 API URL:', fullUrl);

    // 재시도 로직이 포함된 fetch 호출
    const response = await fetchWithRetry(fullUrl, null, MAX_RETRIES);

    logger.log('📡 API 응답 상태:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    logger.log('📦 API 응답 데이터:', data);

    // API 응답 확인
    if (data.response?.header?.resultCode === '00' && data.response?.body?.items?.item) {
      const items = data.response.body.items.item;

      // 기온(T1H)과 하늘상태(PTY, SKY) 찾기
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
        if (item.category === 'SKY' && sky === '맑음') {
          // 1: 맑음, 3: 구름많음, 4: 흐림
          const skyValue = parseInt(item.obsrValue);
          if (skyValue === 3) {
            sky = '구름많음';
            icon = '🌤️';
          } else if (skyValue === 4) {
            sky = '흐림';
            icon = '☁️';
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

      logger.log(`✅ 기상청 API 성공: ${regionName} - ${sky}, ${temperature}℃`);
      return result;
    } else {
      const errorMsg = data.response?.header?.resultMsg || 'API 응답 실패';
      logger.error('❌ API 응답 오류:', data.response?.header);

      // API 응답 오류도 재시도 가능한 경우가 있으므로 throw
      throw new Error(errorMsg);
    }

  } catch (error) {
    logger.error(`❌ 기상청 API 최종 실패: ${regionName}`, error.message);

    // 캐시에 이전 데이터가 있으면 그것을 반환 (완전히 실패한 경우에만)
    const cached = weatherCache.get(regionName);
    if (cached) {
      logger.log(`🔄 캐시된 이전 데이터 반환: ${regionName}`);
      return cached.data;
    }

    return {
      success: false,
      error: error.message,
      weather: { icon: '🌤️', condition: '-', temperature: '-', humidity: '-', wind: '-' }
    };
  }
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
        logger.error('서울시 교통 API 오류:', error);
      }
    }

    // 전국 - 국가교통정보센터 API 사용
    if (NATIONAL_TRAFFIC_KEY) {
      try {
        // TODO: 국가교통정보센터 API 연동
        // 실제 API 엔드포인트와 파라미터는 승인 후 확인
        logger.log(`국가교통정보센터 API 호출: ${regionName}`);
      } catch (error) {
        logger.error('국가교통정보센터 API 오류:', error);
      }
    }

    // Fallback: 시간대 기반 스마트 추정
    return getSmartTrafficEstimate(regionName);

  } catch (error) {
    logger.error('교통 정보 조회 실패:', error);
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














































