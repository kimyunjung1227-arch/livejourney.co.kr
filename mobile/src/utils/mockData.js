import { regionDefaultImages } from './regionDefaultImages';

const KOREAN_USERS = [
    "김유랑", "이여행", "박지도", "최풍경", "정맛집", "강산행", "조캠핑", "윤카페", "장산책", "한바다",
    "민시내", "성하늘", "우주리", "신바람", "오름직", "서해안", "남해인", "동해선", "백두산", "한라산"
];

const CATEGORY_IMAGES = {
    bloom: [
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1557971280-4927ed535804?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1599052062402-2374e2a6c8e3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1463930472251-6893796d88bd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&w=800&q=80"
    ],
    food: [
        "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1553163147-622ab57eb1c7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1534422298391-e4f8c170db06?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1547928576-a4a33237cea2?auto=format&fit=crop&w=800&q=80"
    ],
    scenic: [
        "https://images.unsplash.com/photo-1548115184-bc65ae4986cf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1514222139-b7b6bb23c72b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?auto=format&fit=crop&w=800&q=80"
    ],
    waiting: [
        "https://images.unsplash.com/photo-1551632432-c735e8299921?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"
    ]
};

const createMockPosts = () => {
    const posts = [];
    const regions = Object.keys(regionDefaultImages).filter(k => k !== 'default');
    const categories = ['scenic', 'food', 'bloom', 'waiting'];

    const contentTemplates = {
        bloom: [
            "꽃이 너무 예쁘게 피었어요! 🌸 개화정보 공유합니다.",
            "주말 나들이 왔는데 개화 상태 90%입니다. 너무 예뻐요.",
            "벚꽃 터널 아래서 힐링 중~ 사진 꼭 찍으세요!",
            "사람들이 꽤 많지만 꽃이 너무 예뻐서 행복해요.",
            "올해 꽃구경은 여기가 명당이네요!"
        ],
        food: [
            "맛집정보! 여기 웨이팅한 보람이 있네요. 진짜 맛있어요 🍜",
            "비주얼 실화인가요? 맛까지 훌륭한 찐맛집입니다.",
            "분위기 좋은 카페 발견! 인생샷 건지러 오세요.",
            "맛집 탐방 성공! 친구들이랑 오기 너무 좋아요.",
            "양이 정말 푸짐한 가성비 맛집 추천합니다!"
        ],
        scenic: [
            "추천여행지! 풍경이 정말 예술이에요. 꼭 와보세요. ✨",
            "가만히 앉아만 있어도 힐링되는 최고의 풍경입니다.",
            "탁 트인 전망이 가슴을 뻥 뚫리게 해주네요. 🏔️",
            "노을 맛집입니다. 인생 사진 남기기 딱 좋아요.",
            "자연과 함께하는 산책로, 힐링 코스로 최고입니다."
        ],
        waiting: [
            "지금 여기 웨이팅 엄청나요! 😱 오실 분들 참고하세요.",
            "대기 줄이 길지만 금방 빠지는 것 같아요. 현장 상황입니다.",
            "현재 붐비는 상황! 사람이 정말 많으니 주의하세요.",
            "웨이팅 30분 정도 예상되네요. 그래도 기다릴만 합니다.",
            "현장 상황 제보! 지금은 조금 여유로운 편이에요."
        ]
    };

    const tagPools = {
        bloom: [
            ['꽃', '개화', '벚꽃', '봄나들이'],
            ['벚꽃', '포토존', '인생샷', '개화정보'],
            ['꽃놀이', '힐링', '주말여행', '꽃구경'],
            ['개화', '봄', '산책', '자연'],
            ['꽃터널', '명당', '포토스팟', '봄날']
        ],
        food: [
            ['맛집', '웨이팅', '인생맛집', '맛집탐방'],
            ['브런치', '카페', '인생샷', '분위기맛집'],
            ['카페', '커피', '디저트', '포토카페'],
            ['맛집', '친구모임', '데이트', '추천맛집'],
            ['가성비맛집', '푸짐한', '한그릇', '맛집정보']
        ],
        scenic: [
            ['추천여행지', '풍경', '힐링', '명소'],
            ['전망', '뷰맛집', '힐링', '풍경'],
            ['전망대', '조망', '산', '탁트인전망'],
            ['노을', '일몰', '인생사진', '노을맛집'],
            ['산책로', '자연', '힐링코스', '등산']
        ],
        waiting: [
            ['웨이팅', '현장제보', '대기', '붐비는곳'],
            ['웨이팅', '대기줄', '현장상황', '실시간'],
            ['붐비는곳', '인기맛집', '웨이팅', '주의'],
            ['웨이팅', '30분대기', '현장제보', '인기'],
            ['현장상황', '여유', '웨이팅', '실시간']
        ]
    };

    let postCounter = 0;

    for (let loop = 0; loop < 2; loop++) {
        regions.forEach((region, index) => {
            const categoryIndex = (index + loop) % categories.length;
            const category = categories[categoryIndex];
            const timestamp = Date.now() - (Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000));
            const user = KOREAN_USERS[(index + loop) % KOREAN_USERS.length];
            const templates = contentTemplates[category];
            const contentIndex = Math.floor(Math.random() * templates.length);
            const content = templates[contentIndex];

            const pool = tagPools[category][contentIndex];
            const tagCount = 3 + Math.floor(Math.random() * 2);
            const shuffled = [...pool].sort(() => 0.5 - Math.random());
            const tags = shuffled.slice(0, tagCount).map(t => (t.startsWith('#') ? t : `#${t}`));

            if (region && !tags.some(t => t.includes(region))) {
                tags.push(`#${region}`);
            }

            const regionImg = regionDefaultImages[region];
            const categoryImgs = CATEGORY_IMAGES[category];

            const shuffledCategory = [...categoryImgs].sort(() => 0.5 - Math.random());
            const selectedImgs = [shuffledCategory[0], regionImg, ...shuffledCategory.slice(1)].slice(0, 6);

            postCounter++;
            posts.push({
                id: `mock-${loop}-${index}-${postCounter}-${region}`,
                location: region,
                category,
                categoryLabel: category === 'bloom' ? '개화정보' : category === 'food' ? '맛집정보' : category === 'scenic' ? '가볼만한 곳' : '웨이팅',
                categoryName: category === 'bloom' ? '개화정보' : category === 'food' ? '맛집정보' : category === 'scenic' ? '가볼만한 곳' : '지금 상황',
                image: selectedImgs[0],
                images: selectedImgs,
                tags,
                note: content,
                content: content,
                likes: Math.floor(Math.random() * 500) + 10,
                timestamp,
                createdAt: new Date(timestamp).toISOString(),
                user: user,
                userId: `mock-user-${(index + loop) % KOREAN_USERS.length}`,
                userAvatar: `https://i.pravatar.cc/150?u=mock-user-${(index + loop) % KOREAN_USERS.length}`,
                comments: [
                    { id: 1, user: "여행러버", content: "와 가보고 싶네요!", time: "1시간 전", avatar: "https://i.pravatar.cc/150?u=1" },
                    { id: 2, user: "동네주민", content: "여기 요새 핫해요~", time: "30분 전", avatar: "https://i.pravatar.cc/150?u=2" }
                ],
                coordinates: {
                    lat: 35.0 + (Math.random() * 3.0),
                    lng: 126.0 + (Math.random() * 3.0)
                }
            });
        });
    }

    return posts;
};

export const MOCK_POSTS = createMockPosts();

export const getCombinedPosts = (localPosts = []) => {
    const safeLocalPosts = Array.isArray(localPosts) ? localPosts : [];
    return [...safeLocalPosts, ...MOCK_POSTS];
};
