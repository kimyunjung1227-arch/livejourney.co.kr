
// 모바일용 날씨 API
// web/src/api/weather.js 로직을 React Native 호환되게 포팅

export const getWeatherByRegion = async (regionName) => {
    // 실제 API 연동은 키가 필요하므로, 여기서는 Mock 데이터를 먼저 제공하고
    // 필요 시 실제 fetch 로직 추가 가능 (Web과 동일한 키 사용 시)

    // Mock Data Logic
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

    // 기본값 서울
    const mockWeather = mockWeatherData[regionName] || mockWeatherData['서울'];

    // 비동기 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        success: true,
        weather: {
            ...mockWeather,
            humidity: '60%',
            wind: '5m/s'
        }
    };
};
