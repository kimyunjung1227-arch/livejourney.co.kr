import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';

const PointsShopScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 상품 데이터 (다양한 카테고리)
  const products = {
    food: [
      { id: 1, name: '스타벅스 아메리카노', points: 4500, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLXxU946wFSIRILVgRGqB3S11nYBqJBc13AR05UnMdlfp1vcUhDr9PaIqWJfT3C3CRUEVfOEOcyUZcMZM1sAJZMbrE0zWoeMULhJgpAbtGokj7tTjbUbfmn04PADwX0IoLk_Db95duo-sCpIBcWjN1PHX04kU-LxUAJMPfAkC-4LcYyIIchc5iOA8ZqD5bpE4XZRiFW_CDx3OgHPDS50cHCmW8nsW-BTDRjsbYV7vEadnxitZEd8KU3-v2vMOY83esqJZZQtKCGrs' },
      { id: 2, name: '커피빈 기프트카드', points: 5000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtsft8q7KBLYmmUczE-67gu_TfCWiqkWiJ5vG0vUlWC4kINvuSXEIg7PGpT7MDpXWwwq6TitAAqC8KMoTbr-LMB5WAMyO5T9Crh5nwFa8dg8FifjRn6slV2HjC8e287kO6oum-uOwS78wlFy6KeVzKauFg3GHUxbY_2Xgd2qsp2FHOwaOimqRs7JhBLxxHuT-OJejov9ntuw9V7PzoRNBlGaUVBo4j-mF8Xl-CVBHfY8PM9VD6hRhy9_lp9GUdgBKQQSuRlmdcWN8' },
      { id: 3, name: '투썸플레이스 케이크', points: 6000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLXxU946wFSIRILVgRGqB3S11nYBqJBc13AR05UnMdlfp1vcUhDr9PaIqWJfT3C3CRUEVfOEOcyUZcMZM1sAJZMbrE0zWoeMULhJgpAbtGokj7tTjbUbfmn04PADwX0IoLk_Db95duo-sCpIBcWjN1PHX04kU-LxUAJMPfAkC-4LcYyIIchc5iOA8ZqD5bpE4XZRiFW_CDx3OgHPDS50cHCmW8nsW-BTDRjsbYV7vEadnxitZEd8KU3-v2vMOY83esqJZZQtKCGrs' },
      { id: 4, name: '빽다방 음료 쿠폰', points: 3500, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLXxU946wFSIRILVgRGqB3S11nYBqJBc13AR05UnMdlfp1vcUhDr9PaIqWJfT3C3CRUEVfOEOcyUZcMZM1sAJZMbrE0zWoeMULhJgpAbtGokj7tTjbUbfmn04PADwX0IoLk_Db95duo-sCpIBcWjN1PHX04kU-LxUAJMPfAkC-4LcYyIIchc5iOA8ZqD5bpE4XZRiFW_CDx3OgHPDS50cHCmW8nsW-BTDRjsbYV7vEadnxitZEd8KU3-v2vMOY83esqJZZQtKCGrs' }
    ],
    convenience: [
      { id: 5, name: 'GS25 모바일상품권 5천원', points: 5000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCICJo2OjvdRXIjO8UVcOjX7frgeI8HQAGHjPb3gtfX80F-eyBxuBieG2zMv0iPB5KyDuiyW5sPtmmWrs1brQeYTkgTMzK2p74-XaPlgB6eW8_FVKTsmPoBRxXOmpG7T12pK5kC_k85mknYo9oOoz9aexk-Av7fLwlVZRrk4diQSd_L14i05EKiOCpe7gNqxJKc2RHYuT665_AfLWh1OxeRPs7aUH9XJOAdu_8HqPAfWcvYYlWev4CEnisCXnvUrIm0Y7CjlHfW_EY' },
      { id: 6, name: 'CU 모바일쿠폰 1만원', points: 10000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCICJo2OjvdRXIjO8UVcOjX7frgeI8HQAGHjPb3gtfX80F-eyBxuBieG2zMv0iPB5KyDuiyW5sPtmmWrs1brQeYTkgTMzK2p74-XaPlgB6eW8_FVKTsmPoBRxXOmpG7T12pK5kC_k85mknYo9oOoz9aexk-Av7fLwlVZRrk4diQSd_L14i05EKiOCpe7gNqxJKc2RHYuT665_AfLWh1OxeRPs7aUH9XJOAdu_8HqPAfWcvYYlWev4CEnisCXnvUrIm0Y7CjlHfW_EY' },
      { id: 7, name: '세븐일레븐 3천원권', points: 3000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCICJo2OjvdRXIjO8UVcOjX7frgeI8HQAGHjPb3gtfX80F-eyBxuBieG2zMv0iPB5KyDuiyW5sPtmmWrs1brQeYTkgTMzK2p74-XaPlgB6eW8_FVKTsmPoBRxXOmpG7T12pK5kC_k85mknYo9oOoz9aexk-Av7fLwlVZRrk4diQSd_L14i05EKiOCpe7gNqxJKc2RHYuT665_AfLWh1OxeRPs7aUH9XJOAdu_8HqPAfWcvYYlWev4CEnisCXnvUrIm0Y7CjlHfW_EY' },
      { id: 8, name: '이마트24 5천원권', points: 5000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCICJo2OjvdRXIjO8UVcOjX7frgeI8HQAGHjPb3gtfX80F-eyBxuBieG2zMv0iPB5KyDuiyW5sPtmmWrs1brQeYTkgTMzK2p74-XaPlgB6eW8_FVKTsmPoBRxXOmpG7T12pK5kC_k85mknYo9oOoz9aexk-Av7fLwlVZRrk4diQSd_L14i05EKiOCpe7gNqxJKc2RHYuT665_AfLWh1OxeRPs7aUH9XJOAdu_8HqPAfWcvYYlWev4CEnisCXnvUrIm0Y7CjlHfW_EY' }
    ],
    bakery: [
      { id: 9, name: '파리바게뜨 5천원권', points: 5000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtsft8q7KBLYmmUczE-67gu_TfCWiqkWiJ5vG0vUlWC4kINvuSXEIg7PGpT7MDpXWwwq6TitAAqC8KMoTbr-LMB5WAMyO5T9Crh5nwFa8dg8FifjRn6slV2HjC8e287kO6oum-uOwS78wlFy6KeVzKauFg3GHUxbY_2Xgd2qsp2FHOwaOimqRs7JhBLxxHuT-OJejov9ntuw9V7PzoRNBlGaUVBo4j-mF8Xl-CVBHfY8PM9VD6hRhy9_lp9GUdgBKQQSuRlmdcWN8' },
      { id: 10, name: '뚜레쥬르 3천원권', points: 3000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtsft8q7KBLYmmUczE-67gu_TfCWiqkWiJ5vG0vUlWC4kINvuSXEIg7PGpT7MDpXWwwq6TitAAqC8KMoTbr-LMB5WAMyO5T9Crh5nwFa8dg8FifjRn6slV2HjC8e287kO6oum-uOwS78wlFy6KeVzKauFg3GHUxbY_2Xgd2qsp2FHOwaOimqRs7JhBLxxHuT-OJejov9ntuw9V7PzoRNBlGaUVBo4j-mF8Xl-CVBHfY8PM9VD6hRhy9_lp9GUdgBKQQSuRlmdcWN8' }
    ],
    movie: [
      { id: 11, name: 'CGV 영화 관람권', points: 12000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVFPAPt_XM5FWnpecep25NhzH7ldRk7ZMYgA3xoyGJtCLR4xAII1ZrM1b77CibimwBojK-dEn9KhIqtUW3dB6UOZKO3-GQ-yFA3ozjoyAfuhcAN32aFfANEzs1-WObp94w52dufSrIX0JXZFP7M80-EbqD52suVqgB0GLnnuK4NGptH1i9G3vOmVn-NIO65f8Z3xiflVUWhwIH2QkTA_QEJjk-P8Kjppnm32ZJcVP6ZkvjPfSOj1Or4I-Kj1TllZW4k0SzgOpM8II' },
      { id: 12, name: '메가박스 관람권', points: 11000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVFPAPt_XM5FWnpecep25NhzH7ldRk7ZMYgA3xoyGJtCLR4xAII1ZrM1b77CibimwBojK-dEn9KhIqtUW3dB6UOZKO3-GQ-yFA3ozjoyAfuhcAN32aFfANEzs1-WObp94w52dufSrIX0JXZFP7M80-EbqD52suVqgB0GLnnuK4NGptH1i9G3vOmVn-NIO65f8Z3xiflVUWhwIH2QkTA_QEJjk-P8Kjppnm32ZJcVP6ZkvjPfSOj1Or4I-Kj1TllZW4k0SzgOpM8II' },
      { id: 13, name: '롯데시네마 관람권', points: 12000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVFPAPt_XM5FWnpecep25NhzH7ldRk7ZMYgA3xoyGJtCLR4xAII1ZrM1b77CibimwBojK-dEn9KhIqtUW3dB6UOZKO3-GQ-yFA3ozjoyAfuhcAN32aFfANEzs1-WObp94w52dufSrIX0JXZFP7M80-EbqD52suVqgB0GLnnuK4NGptH1i9G3vOmVn-NIO65f8Z3xiflVUWhwIH2QkTA_QEJjk-P8Kjppnm32ZJcVP6ZkvjPfSOj1Or4I-Kj1TllZW4k0SzgOpM8II' },
      { id: 14, name: '롯데시네마 팝콘세트', points: 8000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVFPAPt_XM5FWnpecep25NhzH7ldRk7ZMYgA3xoyGJtCLR4xAII1ZrM1b77CibimwBojK-dEn9KhIqtUW3dB6UOZKO3-GQ-yFA3ozjoyAfuhcAN32aFfANEzs1-WObp94w52dufSrIX0JXZFP7M80-EbqD52suVqgB0GLnnuK4NGptH1i9G3vOmVn-NIO65f8Z3xiflVUWhwIH2QkTA_QEJjk-P8Kjppnm32ZJcVP6ZkvjPfSOj1Or4I-Kj1TllZW4k0SzgOpM8II' }
    ],
    flight: [
      { id: 15, name: '항공권 할인 쿠폰', points: 10000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVFPAPt_XM5FWnpecep25NhzH7ldRk7ZMYgA3xoyGJtCLR4xAII1ZrM1b77CibimwBojK-dEn9KhIqtUW3dB6UOZKO3-GQ-yFA3ozjoyAfuhcAN32aFfANEzs1-WObp94w52dufSrIX0JXZFP7M80-EbqD52suVqgB0GLnnuK4NGptH1i9G3vOmVn-NIO65f8Z3xiflVUWhwIH2QkTA_QEJjk-P8Kjppnm32ZJcVP6ZkvjPfSOj1Or4I-Kj1TllZW4k0SzgOpM8II' },
      { id: 16, name: '공항 라운지 이용권', points: 7500, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9FYYE76wdeZKWWuSXoJ44U31tu_qI6IXxIfVOzchZLiYJzRdnUR_sH8QJjTMIOWpt0aLHrniEHIvxY7FeRjOZQyR6zsgd7nu5ZaQr-0YrYznhQln4hIqhIOfGF0UAqqebG6JurHNRfo1uPG2FYihRGSAqPv61ATGQOc2IZ-N1RFLe0z3bvSAPP7K97m4U7biVrn1b8zsd2HZZ5W1dfI5YGAG3PfuolS-HVuUE645UnZv2fWSxMIk2xAx5c9MeCytoFHjCdHzJ3Hg' },
      { id: 17, name: '제주항공 5만원 할인', points: 15000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVFPAPt_XM5FWnpecep25NhzH7ldRk7ZMYgA3xoyGJtCLR4xAII1ZrM1b77CibimwBojK-dEn9KhIqtUW3dB6UOZKO3-GQ-yFA3ozjoyAfuhcAN32aFfANEzs1-WObp94w52dufSrIX0JXZFP7M80-EbqD52suVqgB0GLnnuK4NGptH1i9G3vOmVn-NIO65f8Z3xiflVUWhwIH2QkTA_QEJjk-P8Kjppnm32ZJcVP6ZkvjPfSOj1Or4I-Kj1TllZW4k0SzgOpM8II' },
      { id: 18, name: '진에어 3만원 쿠폰', points: 10000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVFPAPt_XM5FWnpecep25NhzH7ldRk7ZMYgA3xoyGJtCLR4xAII1ZrM1b77CibimwBojK-dEn9KhIqtUW3dB6UOZKO3-GQ-yFA3ozjoyAfuhcAN32aFfANEzs1-WObp94w52dufSrIX0JXZFP7M80-EbqD52suVqgB0GLnnuK4NGptH1i9G3vOmVn-NIO65f8Z3xiflVUWhwIH2QkTA_QEJjk-P8Kjppnm32ZJcVP6ZkvjPfSOj1Or4I-Kj1TllZW4k0SzgOpM8II' }
    ],
    accommodation: [
      { id: 19, name: '호텔 숙박권', points: 15000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGuE5kezwpm0yOgQOewEyiQkEpXOZn85U09hw7d5mbsbwZNPbuGCr_qSySwaAJZPwLB4OqPKqlE9MN3DQQoBwuBkocPAtaMCxet6OmrGMKOnylLSFl4I3G82ZJVtx2oY-yeMFwiK8_rQ3Khwp9Xi6IBO7C9ZZ1LnRMweSeauLG21TbC1vigkKjSXpd0g93b6yLPayUdSzFCpoxkAkWmom-Q8l2-qnGVVqtlqUkFLTJ0_av2QwyeiKf5M67BjXpFxWCQ029VKDF-Oo' },
      { id: 20, name: '면세점 상품권', points: 3000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCICJo2OjvdRXIjO8UVcOjX7frgeI8HQAGHjPb3gtfX80F-eyBxuBieG2zMv0iPB5KyDuiyW5sPtmmWrs1brQeYTkgTMzK2p74-XaPlgB6eW8_FVKTsmPoBRxXOmpG7T12pK5kC_k85mknYo9oOoz9aexk-Av7fLwlVZRrk4diQSd_L14i05EKiOCpe7gNqxJKc2RHYuT665_AfLWh1OxeRPs7aUH9XJOAdu_8HqPAfWcvYYlWev4CEnisCXnvUrIm0Y7CjlHfW_EY' },
      { id: 21, name: '펜션 숙박권 10만원', points: 30000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGuE5kezwpm0yOgQOewEyiQkEpXOZn85U09hw7d5mbsbwZNPbuGCr_qSySwaAJZPwLB4OqPKqlE9MN3DQQoBwuBkocPAtaMCxet6OmrGMKOnylLSFl4I3G82ZJVtx2oY-yeMFwiK8_rQ3Khwp9Xi6IBO7C9ZZ1LnRMweSeauLG21TbC1vigkKjSXpd0g93b6yLPayUdSzFCpoxkAkWmom-Q8l2-qnGVVqtlqUkFLTJ0_av2QwyeiKf5M67BjXpFxWCQ029VKDF-Oo' },
      { id: 22, name: '에어비앤비 5만원권', points: 20000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGuE5kezwpm0yOgQOewEyiQkEpXOZn85U09hw7d5mbsbwZNPbuGCr_qSySwaAJZPwLB4OqPKqlE9MN3DQQoBwuBkocPAtaMCxet6OmrGMKOnylLSFl4I3G82ZJVtx2oY-yeMFwiK8_rQ3Khwp9Xi6IBO7C9ZZ1LnRMweSeauLG21TbC1vigkKjSXpd0g93b6yLPayUdSzFCpoxkAkWmom-Q8l2-qnGVVqtlqUkFLTJ0_av2QwyeiKf5M67BjXpFxWCQ029VKDF-Oo' }
    ],
    giftcard: [
      { id: 23, name: '컬쳐랜드 1만원권', points: 10000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCICJo2OjvdRXIjO8UVcOjX7frgeI8HQAGHjPb3gtfX80F-eyBxuBieG2zMv0iPB5KyDuiyW5sPtmmWrs1brQeYTkgTMzK2p74-XaPlgB6eW8_FVKTsmPoBRxXOmpG7T12pK5kC_k85mknYo9oOoz9aexk-Av7fLwlVZRrk4diQSd_L14i05EKiOCpe7gNqxJKc2RHYuT665_AfLWh1OxeRPs7aUH9XJOAdu_8HqPAfWcvYYlWev4CEnisCXnvUrIm0Y7CjlHfW_EY' },
      { id: 24, name: '해피머니 상품권 5천원', points: 5000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCICJo2OjvdRXIjO8UVcOjX7frgeI8HQAGHjPb3gtfX80F-eyBxuBieG2zMv0iPB5KyDuiyW5sPtmmWrs1brQeYTkgTMzK2p74-XaPlgB6eW8_FVKTsmPoBRxXOmpG7T12pK5kC_k85mknYo9oOoz9aexk-Av7fLwlVZRrk4diQSd_L14i05EKiOCpe7gNqxJKc2RHYuT665_AfLWh1OxeRPs7aUH9XJOAdu_8HqPAfWcvYYlWev4CEnisCXnvUrIm0Y7CjlHfW_EY' },
      { id: 25, name: '북앤라이프 1만원권', points: 10000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCICJo2OjvdRXIjO8UVcOjX7frgeI8HQAGHjPb3gtfX80F-eyBxuBieG2zMv0iPB5KyDuiyW5sPtmmWrs1brQeYTkgTMzK2p74-XaPlgB6eW8_FVKTsmPoBRxXOmpG7T12pK5kC_k85mknYo9oOoz9aexk-Av7fLwlVZRrk4diQSd_L14i05EKiOCpe7gNqxJKc2RHYuT665_AfLWh1OxeRPs7aUH9XJOAdu_8HqPAfWcvYYlWev4CEnisCXnvUrIm0Y7CjlHfW_EY' },
      { id: 26, name: '문화상품권 5천원', points: 5000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCICJo2OjvdRXIjO8UVcOjX7frgeI8HQAGHjPb3gtfX80F-eyBxuBieG2zMv0iPB5KyDuiyW5sPtmmWrs1brQeYTkgTMzK2p74-XaPlgB6eW8_FVKTsmPoBRxXOmpG7T12pK5kC_k85mknYo9oOoz9aexk-Av7fLwlVZRrk4diQSd_L14i05EKiOCpe7gNqxJKc2RHYuT665_AfLWh1OxeRPs7aUH9XJOAdu_8HqPAfWcvYYlWev4CEnisCXnvUrIm0Y7CjlHfW_EY' }
    ],
    transport: [
      { id: 27, name: '카카오택시 1만원권', points: 10000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVFPAPt_XM5FWnpecep25NhzH7ldRk7ZMYgA3xoyGJtCLR4xAII1ZrM1b77CibimwBojK-dEn9KhIqtUW3dB6UOZKO3-GQ-yFA3ozjoyAfuhcAN32aFfANEzs1-WObp94w52dufSrIX0JXZFP7M80-EbqD52suVqgB0GLnnuK4NGptH1i9G3vOmVn-NIO65f8Z3xiflVUWhwIH2QkTA_QEJjk-P8Kjppnm32ZJcVP6ZkvjPfSOj1Or4I-Kj1TllZW4k0SzgOpM8II' },
      { id: 28, name: 'T머니 충전권 5천원', points: 5000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVFPAPt_XM5FWnpecep25NhzH7ldRk7ZMYgA3xoyGJtCLR4xAII1ZrM1b77CibimwBojK-dEn9KhIqtUW3dB6UOZKO3-GQ-yFA3ozjoyAfuhcAN32aFfANEzs1-WObp94w52dufSrIX0JXZFP7M80-EbqD52suVqgB0GLnnuK4NGptH1i9G3vOmVn-NIO65f8Z3xiflVUWhwIH2QkTA_QEJjk-P8Kjppnm32ZJcVP6ZkvjPfSOj1Or4I-Kj1TllZW4k0SzgOpM8II' },
      { id: 29, name: 'SRT 5천원 할인', points: 5000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVFPAPt_XM5FWnpecep25NhzH7ldRk7ZMYgA3xoyGJtCLR4xAII1ZrM1b77CibimwBojK-dEn9KhIqtUW3dB6UOZKO3-GQ-yFA3ozjoyAfuhcAN32aFfANEzs1-WObp94w52dufSrIX0JXZFP7M80-EbqD52suVqgB0GLnnuK4NGptH1i9G3vOmVn-NIO65f8Z3xiflVUWhwIH2QkTA_QEJjk-P8Kjppnm32ZJcVP6ZkvjPfSOj1Or4I-Kj1TllZW4k0SzgOpM8II' },
      { id: 30, name: 'KTX 1만원 할인권', points: 10000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVFPAPt_XM5FWnpecep25NhzH7ldRk7ZMYgA3xoyGJtCLR4xAII1ZrM1b77CibimwBojK-dEn9KhIqtUW3dB6UOZKO3-GQ-yFA3ozjoyAfuhcAN32aFfANEzs1-WObp94w52dufSrIX0JXZFP7M80-EbqD52suVqgB0GLnnuK4NGptH1i9G3vOmVn-NIO65f8Z3xiflVUWhwIH2QkTA_QEJjk-P8Kjppnm32ZJcVP6ZkvjPfSOj1Or4I-Kj1TllZW4k0SzgOpM8II' }
    ],
    beauty: [
      { id: 31, name: '올리브영 1만원권', points: 10000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCICJo2OjvdRXIjO8UVcOjX7frgeI8HQAGHjPb3gtfX80F-eyBxuBieG2zMv0iPB5KyDuiyW5sPtmmWrs1brQeYTkgTMzK2p74-XaPlgB6eW8_FVKTsmPoBRxXOmpG7T12pK5kC_k85mknYo9oOoz9aexk-Av7fLwlVZRrk4diQSd_L14i05EKiOCpe7gNqxJKc2RHYuT665_AfLWh1OxeRPs7aUH9XJOAdu_8HqPAfWcvYYlWev4CEnisCXnvUrIm0Y7CjlHfW_EY' },
      { id: 32, name: '아리따움 5천원권', points: 5000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCICJo2OjvdRXIjO8UVcOjX7frgeI8HQAGHjPb3gtfX80F-eyBxuBieG2zMv0iPB5KyDuiyW5sPtmmWrs1brQeYTkgTMzK2p74-XaPlgB6eW8_FVKTsmPoBRxXOmpG7T12pK5kC_k85mknYo9oOoz9aexk-Av7fLwlVZRrk4diQSd_L14i05EKiOCpe7gNqxJKc2RHYuT665_AfLWh1OxeRPs7aUH9XJOAdu_8HqPAfWcvYYlWev4CEnisCXnvUrIm0Y7CjlHfW_EY' }
    ]
  };

  // 카테고리 정보 (메인 화면용 - 단순화)
  const categories = [
    { 
      key: 'food', 
      name: '카페 · 식품', 
      icon: '☕', 
      count: products.food.length,
      description: '스타벅스, 커피빈, 투썸플레이스 등'
    },
    { 
      key: 'convenience', 
      name: '편의점', 
      icon: '🏪', 
      count: products.convenience.length,
      description: 'GS25, CU, 세븐일레븐 등'
    },
    { 
      key: 'bakery', 
      name: '베이커리', 
      icon: '🥐', 
      count: products.bakery.length,
      description: '파리바게뜨, 뚜레쥬르 등'
    },
    { 
      key: 'movie', 
      name: '영화', 
      icon: '🎬', 
      count: products.movie.length,
      description: 'CGV, 메가박스, 롯데시네마 등'
    },
    { 
      key: 'flight', 
      name: '항공', 
      icon: '✈️', 
      count: products.flight.length,
      description: '항공권 할인, 제주항공, 진에어 등'
    },
    { 
      key: 'accommodation', 
      name: '숙소', 
      icon: '🏨', 
      count: products.accommodation.length,
      description: '호텔, 펜션, 에어비앤비 등'
    },
    { 
      key: 'giftcard', 
      name: '기프트카드', 
      icon: '🎁', 
      count: products.giftcard.length,
      description: '컬쳐랜드, 해피머니, 문화상품권 등'
    },
    { 
      key: 'transport', 
      name: '교통', 
      icon: '🚗', 
      count: products.transport.length,
      description: '택시, T머니, KTX, SRT 등'
    },
    { 
      key: 'beauty', 
      name: '뷰티', 
      icon: '💄', 
      count: products.beauty.length,
      description: '올리브영, 아리따움 등'
    }
  ];

  const handleExchange = (product) => {
    setSelectedProduct(product);
  };

  const confirmExchange = () => {
    const currentPoints = user?.points || 12500;
    if (currentPoints < selectedProduct.points) {
      alert(`포인트가 부족합니다.\n\n필요 포인트: ${selectedProduct.points.toLocaleString()}P\n보유 포인트: ${currentPoints.toLocaleString()}P`);
      setSelectedProduct(null);
    } else {
      // 교환 성공 - 성공 화면으로 이동
      navigate('/exchange-success', { state: { product: selectedProduct } });
    }
  };

  const cancelExchange = () => {
    setSelectedProduct(null);
  };

  // 카테고리 클릭 시 해당 카테고리 상품 목록으로 이동
  const handleCategoryClick = (categoryKey) => {
    navigate(`/points/category/${categoryKey}`, { 
      state: { 
        category: categories.find(cat => cat.key === categoryKey),
        products: products[categoryKey]
      }
    });
  };

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex flex-col bg-background-light dark:bg-background-dark shadow-sm flex-shrink-0">
        <div className="flex items-center p-4 pb-3 justify-between">
          <button 
            onClick={() => navigate('/points')}
            className="flex size-12 shrink-0 items-center justify-center text-zinc-900 dark:text-zinc-50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <span className="text-2xl">←</span>
          </button>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12 text-zinc-900 dark:text-zinc-50">
            포인트 샵
          </h2>
        </div>

        {/* 보유 포인트 - 강조 */}
        <div className="px-4 pb-4">
          <div className="flex flex-col gap-3 rounded-2xl bg-white dark:bg-zinc-800 p-6 shadow-xl border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                  내 포인트
                </p>
                <p className="text-primary text-4xl font-black tracking-tight">
                  {user?.points?.toLocaleString() || '12,500'}
                </p>
                <p className="text-zinc-500 dark:text-zinc-500 text-xs font-medium mt-0.5">
                  💎 1P = 1원
                </p>
              </div>
              <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-primary/10">
                <span className="text-4xl">💰</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 - 카테고리 그리드 */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20">
        <div className="p-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-3 px-1">
            상품 카테고리
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => handleCategoryClick(category.key)}
                className="flex flex-col gap-3 p-5 rounded-xl bg-white dark:bg-zinc-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-transparent hover:border-primary/20"
              >
                {/* 아이콘 - 단순화 */}
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
                  <span className="text-4xl">{category.icon}</span>
                </div>
                
                {/* 카테고리 정보 */}
                <div className="flex flex-col gap-1 text-center">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {category.name}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {category.description}
                  </p>
                  <p className="text-xs font-semibold text-primary mt-1">
                    {category.count}개 상품
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* 안내 메시지 */}
          <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                  포인트 사용 안내
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1 mt-1">
                  <li>• 1포인트는 1원의 가치를 가집니다</li>
                  <li>• 교환 후 취소 및 환불이 불가능합니다</li>
                  <li>• 상품은 모바일 쿠폰으로 발급됩니다</li>
                  <li>• 유효기간은 상품별로 상이합니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />

      {/* 교환 확인 모달 */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
          <div className="w-full max-w-sm transform flex-col rounded-xl bg-white dark:bg-[#221910] p-6 shadow-2xl transition-all">
            {/* 제목 */}
            <h1 className="text-[#181411] dark:text-gray-100 text-[22px] font-bold leading-tight tracking-[-0.015em] text-center pb-3 pt-1">
              상품 교환 확인
            </h1>
            
            {/* 내용 */}
            <div className="flex flex-col gap-4 pb-6 pt-2">
              <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                  선택한 상품
                </p>
                <p className="text-gray-900 dark:text-gray-100 text-base font-bold">
                  {selectedProduct.name}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-primary text-2xl font-extrabold">
                    {selectedProduct.points.toLocaleString()}원
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    ({selectedProduct.points.toLocaleString()}P)
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 text-sm font-normal leading-relaxed px-2 text-center">
                💎 <strong className="font-bold">1P = 1원</strong>의 가치로 교환됩니다<br/>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">교환 후에는 취소 및 환불이 불가능합니다</span>
              </p>
            </div>
            
            {/* 버튼 그룹 */}
            <div className="flex w-full flex-row gap-3">
              <button 
                onClick={cancelExchange}
                className="flex flex-1 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-gray-200 dark:bg-gray-700 text-[#181411] dark:text-gray-200 text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="truncate">취소</span>
              </button>
              <button 
                onClick={confirmExchange}
                className="flex flex-1 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
              >
                <span className="truncate">교환하기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsShopScreen;

