// 브라우저 환경 감지 유틸리티

/**
 * 인앱 브라우저(WebView) 감지
 * 카카오톡, 페이스북, 인스타그램 등에서 접속했는지 확인
 */
export function isInAppBrowser(): boolean {
  // 서버사이드에서는 항상 false 반환
  if (typeof window === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent.toLowerCase();

  // 카카오톡 인앱 브라우저
  if (ua.includes('kakaotalk')) {
    return true;
  }

  // 페이스북 인앱 브라우저
  if (ua.includes('fb_iab') || ua.includes('fbav') || ua.includes('fban')) {
    return true;
  }

  // 인스타그램 인앱 브라우저
  if (ua.includes('instagram')) {
    return true;
  }

  // 라인 인앱 브라우저
  if (ua.includes('line')) {
    return true;
  }

  // 네이버 인앱 브라우저
  if (ua.includes('naver') && ua.includes('inapp')) {
    return true;
  }

  // Android WebView (일반)
  if (ua.includes('android') && ua.includes('wv')) {
    return true;
  }

  return false;
}

/**
 * 현재 인앱 브라우저 종류 반환
 */
export function getInAppBrowserType(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('kakaotalk')) return 'kakaotalk';
  if (ua.includes('fb_iab') || ua.includes('fbav')) return 'facebook';
  if (ua.includes('instagram')) return 'instagram';
  if (ua.includes('line')) return 'line';
  if (ua.includes('naver') && ua.includes('inapp')) return 'naver';
  if (ua.includes('android') && ua.includes('wv')) return 'android-webview';

  return null;
}

/**
 * 외부 브라우저에서 열기
 * 사용자에게 외부 브라우저로 URL을 여는 방법 안내
 */
export function openInExternalBrowser(url?: string): void {
  const targetUrl = url || window.location.href;

  // iOS: Safari에서 열기
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    // iOS에서는 사용자가 직접 "Safari에서 열기" 버튼을 눌러야 함
    alert('우측 상단의 [...] 메뉴를 눌러 "Safari에서 열기"를 선택해주세요.');
    return;
  }

  // Android: Chrome에서 열기 시도
  if (/android/i.test(navigator.userAgent)) {
    const intent = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intent;

    // Chrome이 없는 경우를 대비한 안내
    setTimeout(() => {
      alert('외부 브라우저(Chrome, Samsung Internet 등)에서 이 페이지를 열어주세요.');
    }, 1000);
    return;
  }

  // 기본 안내
  alert('외부 브라우저에서 이 페이지를 열어주세요.');
}

/**
 * 브라우저별 안내 메시지
 */
export function getInAppBrowserMessage(type: string | null): string {
  switch (type) {
    case 'kakaotalk':
      return '카카오톡 인앱 브라우저에서는 Google 로그인이 제한됩니다.';
    case 'facebook':
      return '페이스북 인앱 브라우저에서는 Google 로그인이 제한됩니다.';
    case 'instagram':
      return '인스타그램 인앱 브라우저에서는 Google 로그인이 제한됩니다.';
    case 'line':
      return '라인 인앱 브라우저에서는 Google 로그인이 제한됩니다.';
    case 'naver':
      return '네이버 인앱 브라우저에서는 Google 로그인이 제한됩니다.';
    default:
      return '인앱 브라우저에서는 Google 로그인이 제한됩니다.';
  }
}

/**
 * 외부 브라우저 열기 안내 메시지
 */
export function getOpenInBrowserInstructions(): { title: string; steps: string[] } {
  const ua = navigator.userAgent.toLowerCase();

  // iOS
  if (/iphone|ipad|ipod/i.test(ua)) {
    return {
      title: 'Safari에서 열기',
      steps: [
        '우측 상단의 [...] 메뉴를 탭하세요',
        '"Safari에서 열기" 또는 "기본 브라우저에서 열기"를 선택하세요',
        'Safari에서 다시 로그인해주세요'
      ]
    };
  }

  // Android
  if (/android/i.test(ua)) {
    if (ua.includes('kakaotalk')) {
      return {
        title: 'Chrome에서 열기',
        steps: [
          '우측 상단의 [...] 메뉴를 탭하세요',
          '"다른 브라우저로 열기" 또는 "Chrome에서 열기"를 선택하세요',
          'Chrome에서 다시 로그인해주세요'
        ]
      };
    }

    return {
      title: '외부 브라우저에서 열기',
      steps: [
        '우측 상단의 [...] 메뉴를 탭하세요',
        '"외부 브라우저에서 열기"를 선택하세요',
        'Chrome 또는 Samsung Internet에서 다시 로그인해주세요'
      ]
    };
  }

  // 기타
  return {
    title: '외부 브라우저에서 열기',
    steps: [
      '메뉴에서 "외부 브라우저에서 열기"를 선택하세요',
      '정식 브라우저에서 다시 로그인해주세요'
    ]
  };
}
