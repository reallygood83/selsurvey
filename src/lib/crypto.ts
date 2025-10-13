// 🔐 암호화/복호화 유틸리티
// Web Crypto API를 사용한 AES-GCM 암호화

/**
 * 사용자별 암호화 키 생성
 * - 사용자 UID와 고정 salt를 사용하여 일관된 키 생성
 * - PBKDF2 알고리즘으로 강력한 키 파생
 */
async function deriveKey(userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  // 사용자 UID를 기반으로 키 생성 (일관성 유지)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // 고정 salt (프로젝트별로 고유하게 설정)
  // 실제 배포 시에는 환경 변수로 관리하는 것을 권장
  const salt = encoder.encode('sel-mindlog-2025-secure-salt-v1');

  // PBKDF2로 키 파생 (100,000 iterations)
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * API 키 암호화
 * @param apiKey - 원본 Gemini API 키
 * @param userId - 사용자 UID (암호화 키 생성용)
 * @returns Base64 인코딩된 암호화 데이터 (IV + 암호문)
 */
export async function encryptApiKey(apiKey: string, userId: string): Promise<string> {
  try {
    // 1. 암호화 키 생성
    const key = await deriveKey(userId);

    // 2. 랜덤 IV(Initialization Vector) 생성
    const iv = crypto.getRandomValues(new Uint8Array(12)); // GCM 표준 12바이트

    // 3. 데이터 인코딩
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);

    // 4. AES-GCM으로 암호화
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    // 5. IV + 암호문을 결합하여 저장 (IV는 공개되어도 안전)
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // 6. Base64로 인코딩하여 문자열로 변환
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('❌ API 키 암호화 실패:', error);
    throw new Error('API 키 암호화에 실패했습니다.');
  }
}

/**
 * API 키 복호화
 * @param encryptedData - Base64 인코딩된 암호화 데이터
 * @param userId - 사용자 UID (복호화 키 생성용)
 * @returns 복호화된 원본 API 키
 */
export async function decryptApiKey(encryptedData: string, userId: string): Promise<string> {
  try {
    // 1. Base64 디코딩
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // 2. IV와 암호문 분리
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    // 3. 복호화 키 생성 (암호화 시와 동일한 키)
    const key = await deriveKey(userId);

    // 4. AES-GCM으로 복호화
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );

    // 5. 문자열로 변환
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('❌ API 키 복호화 실패:', error);
    throw new Error('API 키 복호화에 실패했습니다. 데이터가 손상되었을 수 있습니다.');
  }
}

/**
 * 암호화 시스템 테스트 (개발용)
 */
export async function testEncryption(userId: string): Promise<boolean> {
  try {
    const testApiKey = 'AIzaSyTest123456789';

    console.log('🔐 암호화 테스트 시작...');
    console.log('원본 API 키:', testApiKey);

    // 암호화
    const encrypted = await encryptApiKey(testApiKey, userId);
    console.log('✅ 암호화 성공:', encrypted.substring(0, 20) + '...');

    // 복호화
    const decrypted = await decryptApiKey(encrypted, userId);
    console.log('✅ 복호화 성공:', decrypted);

    // 검증
    const isValid = testApiKey === decrypted;
    console.log(isValid ? '✅ 암호화/복호화 검증 성공!' : '❌ 검증 실패!');

    return isValid;
  } catch (error) {
    console.error('❌ 암호화 테스트 실패:', error);
    return false;
  }
}
