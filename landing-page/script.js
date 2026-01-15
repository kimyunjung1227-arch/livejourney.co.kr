// Email Form Submission
document.addEventListener('DOMContentLoaded', function() {
  const emailForm = document.getElementById('signupForm');
  const emailInput = document.getElementById('emailInput');
  
  if (!emailForm || !emailInput) {
    console.log('Form not found, skipping form handler');
  } else {
    const emailSubmit = emailForm.querySelector('button[type="submit"]');
  
    emailForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      
      if (!email) {
        alert('이메일을 입력해주세요.');
        return;
      }
  
      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('올바른 이메일 형식을 입력해주세요.');
        return;
      }
  
      // 버튼 상태 변경
      emailSubmit.textContent = '처리 중...';
      emailSubmit.disabled = true;
  
      // TODO: 실제 백엔드 API 연동
      // 현재는 로컬스토리지에 저장하고 시뮬레이션
      setTimeout(() => {
        // 로컬스토리지에 저장
        const subscribers = JSON.parse(localStorage.getItem('subscribers') || '[]');
        
        if (subscribers.includes(email)) {
          alert('이미 등록된 이메일입니다.');
          emailSubmit.textContent = '초기 멤버 신청';
          emailSubmit.disabled = false;
          return;
        }
  
        subscribers.push(email);
        localStorage.setItem('subscribers', JSON.stringify(subscribers));
  
        // 성공 처리
        emailSubmit.textContent = '✓ 신청 완료!';
        emailSubmit.classList.add('success');
        emailInput.value = '';
  
        // 감사 메시지
        alert('감사합니다! 라이브 저니의 초기 멤버가 되셨습니다.\n서비스 출시 소식을 이메일로 보내드리겠습니다.');
  
        // 3초 후 버튼 원상복구
        setTimeout(() => {
          emailSubmit.textContent = '초기 멤버 신청';
          emailSubmit.classList.remove('success');
          emailSubmit.disabled = false;
        }, 3000);
      }, 1000);
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -30px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const revealSelectors = [
    '.mission-section .section-title',
    '.mission-section .mission-statement',
    '.mission-section .mission-description',
    '.problem-section',
    '.solution-section',
    '.value-section',
    '.how-section',
    '.features-section',
    '.founder-section',
    '.impact-section .section-title',
    '.impact-section .section-subtitle',
    '.impact-section .impact-simple-message',
    '.enjoy-section',
    '.faq-section .section-title',
    '.faq-section .section-subtitle',
    '.faq-item',
    '.comparison-card',
    '.solution-item-card',
    '.solution-revolution-card',
    '.solution-summary-table',
    '.solution-closing',
    '.value-card',
    '.story-connection .connection-card',
    '.problem-card',
    '.feature-card',
    '.impact-stat-card'
  ];

  const emphasisSelectors = new Set([
    '.comparison-card',
    '.solution-item-card',
    '.value-card',
    '.impact-stat-card'
  ]);

  revealSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('reveal');
      if ([...emphasisSelectors].includes(selector)) {
        el.classList.add('reveal-emphasis');
      }
      observer.observe(el);
    });
  });

  // Before / After Slider (문제 섹션)
  const beforeAfter = document.getElementById('problemBeforeAfter');
  if (beforeAfter) {
    const afterImage = beforeAfter.querySelector('.after-image');
    const handleLine = beforeAfter.querySelector('.handle-line');
    const handleCircle = beforeAfter.querySelector('.handle-circle');

    const updateSlider = (clientX) => {
      const rect = beforeAfter.getBoundingClientRect();
      let offsetX = clientX - rect.left;
      if (offsetX < 0) offsetX = 0;
      if (offsetX > rect.width) offsetX = rect.width;

      const percentage = (offsetX / rect.width) * 100;
      afterImage.style.clipPath = `inset(0 0 0 ${percentage}%)`;
      handleLine.style.left = `${percentage}%`;
      handleCircle.style.left = `${percentage}%`;
    };

    let isDragging = false;

    const startDrag = (e) => {
      isDragging = true;
      beforeAfter.classList.add('is-dragging');
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updateSlider(clientX);
    };

    const onMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updateSlider(clientX);
    };

    const stopDrag = () => {
      isDragging = false;
      beforeAfter.classList.remove('is-dragging');
    };

    beforeAfter.addEventListener('mousedown', startDrag);
    beforeAfter.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
  }

  // Console message for developers
  console.log('%c🚀 라이브 저니에 오신 것을 환영합니다!', 'color: #667eea; font-size: 20px; font-weight: bold;');
  console.log('%cAPI 연동을 원하시나요? script.js 파일의 TODO 주석을 확인하세요.', 'color: #666; font-size: 14px;');
});

// Real-time API Integration (TODO: Uncomment and modify when backend is ready)
/*
async function submitEmail(email) {
  try {
    const response = await fetch('https://your-api-endpoint.com/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}
*/



