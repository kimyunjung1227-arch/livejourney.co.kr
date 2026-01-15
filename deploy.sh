#!/bin/bash

# 🚀 LiveJourney 배포 스크립트
# 이 스크립트는 배포 전 체크리스트를 확인하고 배포를 도와줍니다.

echo "╔════════════════════════════════════════╗"
echo "║   🚀 LiveJourney 배포 준비            ║"
echo "╚════════════════════════════════════════╝"
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 프론트엔드 빌드 확인
echo "📦 프론트엔드 빌드 확인 중..."
cd web
if [ ! -d "node_modules" ]; then
    echo "${YELLOW}⚠️  node_modules가 없습니다. npm install을 실행합니다...${NC}"
    npm install
fi

echo "🔨 프론트엔드 빌드 중..."
npm run build

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ 프론트엔드 빌드 성공!${NC}"
else
    echo "${RED}❌ 프론트엔드 빌드 실패!${NC}"
    exit 1
fi

cd ..

# 2. 백엔드 의존성 확인
echo ""
echo "📦 백엔드 의존성 확인 중..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "${YELLOW}⚠️  node_modules가 없습니다. npm install을 실행합니다...${NC}"
    npm install
fi
cd ..

# 3. 환경 변수 체크리스트
echo ""
echo "🔐 환경 변수 체크리스트:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "백엔드 (.env 또는 Railway 환경 변수):"
echo "  [ ] MONGODB_URI"
echo "  [ ] JWT_SECRET"
echo "  [ ] SESSION_SECRET"
echo "  [ ] NODE_ENV=production"
echo "  [ ] PORT"
echo "  [ ] FRONTEND_URL"
echo "  [ ] KAKAO_CLIENT_ID (선택)"
echo "  [ ] KAKAO_CLIENT_SECRET (선택)"
echo "  [ ] NAVER_CLIENT_ID (선택)"
echo "  [ ] NAVER_CLIENT_SECRET (선택)"
echo "  [ ] GOOGLE_CLIENT_ID (선택)"
echo "  [ ] GOOGLE_CLIENT_SECRET (선택)"
echo ""
echo "프론트엔드 (Vercel 환경 변수):"
echo "  [ ] VITE_API_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 4. 배포 플랫폼 선택
echo "배포할 플랫폼을 선택하세요:"
echo "1) Vercel (프론트엔드) + Railway (백엔드)"
echo "2) Netlify (프론트엔드) + Railway (백엔드)"
echo "3) 수동 배포"
echo ""
read -p "선택 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "${GREEN}✅ Vercel + Railway 배포 준비 완료!${NC}"
        echo ""
        echo "다음 단계:"
        echo "1. Vercel에 GitHub 저장소 연결"
        echo "2. Root Directory를 'web'으로 설정"
        echo "3. Build Command: npm run build"
        echo "4. Output Directory: dist"
        echo "5. 환경 변수 VITE_API_URL 설정"
        echo ""
        echo "6. Railway에 GitHub 저장소 연결"
        echo "7. Root Directory를 'backend'로 설정"
        echo "8. 환경 변수 설정 (위 체크리스트 참고)"
        ;;
    2)
        echo ""
        echo "${GREEN}✅ Netlify + Railway 배포 준비 완료!${NC}"
        echo ""
        echo "다음 단계:"
        echo "1. Netlify에 GitHub 저장소 연결"
        echo "2. Base directory: web"
        echo "3. Build command: npm run build"
        echo "4. Publish directory: web/dist"
        echo "5. 환경 변수 VITE_API_URL 설정"
        echo ""
        echo "6. Railway에 GitHub 저장소 연결"
        echo "7. Root Directory를 'backend'로 설정"
        echo "8. 환경 변수 설정 (위 체크리스트 참고)"
        ;;
    3)
        echo ""
        echo "${GREEN}✅ 수동 배포 준비 완료!${NC}"
        echo ""
        echo "빌드된 파일:"
        echo "  - web/dist/ (프론트엔드)"
        echo "  - backend/ (백엔드)"
        ;;
    *)
        echo "${RED}❌ 잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✨ 배포 준비 완료!                   ║"
echo "╚════════════════════════════════════════╝"
echo ""
